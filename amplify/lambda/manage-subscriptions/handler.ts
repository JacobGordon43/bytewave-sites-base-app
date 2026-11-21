/**
 * Authenticated subscription list, period-end cancellation and billing-portal sessions.
 * Route {id} is the original app bill ID; raw Stripe IDs are resolved server-side.
 */
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  ApiError,
  assertSafeIdentifier,
  getTenantIdentity,
  response,
} from "../shared/tenant-query";
import { getTableName } from "../shared/environment";
import type { AuthenticatedApiEvent } from "../shared/types";
import { paymentDb, stripeClient } from "../shared/stripe-payment";
import {
  subscriptionState,
  syncSubscription,
  type SubscriptionState,
} from "../shared/stripe-subscriptions";

export const createSubscriptionManagementHandler =
  (getStripe = stripeClient) =>
  async (event: AuthenticatedApiEvent) => {
    try {
      const identity = getTenantIdentity(event);
      const admin = identity.roles.includes("Bytewave-Admin");
      if (!admin && (!identity.client || !identity.subject))
        throw new ApiError(403, "Client or administrator access required.");
      // Clients see their own rows. Admins may select a client within their business.
      // Filter kind=subscription because invoice markers and hosting locks share the table.
      if (event.requestContext.http.method === "GET") {
        const clientId = admin ? event.queryStringParameters?.clientId : identity.subject;
        if (!clientId) throw new ApiError(400, "Select a client.");
        const results: SubscriptionState[] = [];
        let cursor: Record<string, unknown> | undefined;
        do {
          const page = await paymentDb.send(
            new QueryCommand({
              TableName: getTableName("subscription-state"),
              KeyConditionExpression: "businessId = :business",
              FilterExpression: "clientId = :client AND kind = :kind",
              ExpressionAttributeValues: {
                ":business": identity.businessId,
                ":client": clientId,
                ":kind": "subscription",
              },
              ExclusiveStartKey: cursor,
              ConsistentRead: true,
            }),
          );
          results.push(...((page.Items || []) as SubscriptionState[]));
          cursor = page.LastEvaluatedKey;
        } while (cursor);
        return response(200, {
          success: true,
          results: results.map(({ attempt: _attempt, ...state }) => state),
        });
      }
      const id = assertSafeIdentifier(event.pathParameters?.id, "subscription payment ID");
      const state = await subscriptionState(identity.businessId, id);
      if (!state || (!admin && state.clientId !== identity.subject) || !state.stripeSubscriptionId)
        throw new ApiError(404, "Subscription not found.");
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(state.stripeSubscriptionId);
      if (
        subscription.metadata.attempt !== state.attempt ||
        subscription.metadata.paymentId !== id ||
        subscription.metadata.businessId !== identity.businessId
      )
        throw new ApiError(409, "Subscription ownership needs review.");
      // Resolve the Stripe customer from the verified subscription, never from input.
      // Stripe's default portal configuration controls which actions the portal offers.
      if (event.routeKey.endsWith("/portal")) {
        const origin = process.env.PAYMENT_SITE_ORIGIN;
        if (!origin || !/^https?:\/\//.test(origin))
          throw new ApiError(503, "Billing portal return address is not configured.");
        const customer =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        const portal = await stripe.billingPortal.sessions.create({
          customer,
          return_url: `${origin.replace(/\/$/, "")}/client/billing`,
        });
        return response(200, { success: true, result: { url: portal.url } });
      }
      // Stop the next renewal, keeping already-paid hosting coverage. Repeated requests
      // reuse the terminal/already-scheduled state instead of changing it again.
      const updated =
        ["canceled", "incomplete_expired"].includes(subscription.status) ||
        subscription.cancel_at_period_end
          ? subscription
          : await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
      await syncSubscription(updated);
      return response(200, {
        success: true,
        result: { status: updated.status, cancelAtPeriodEnd: updated.cancel_at_period_end },
      });
    } catch (error) {
      if (error instanceof ApiError)
        return response(error.statusCode, { success: false, message: error.message });
      console.error(
        "Subscription management failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      return response(500, {
        success: false,
        message:
          "Unable to manage this subscription. Check the Stripe billing portal configuration or contact support.",
      });
    }
  };
export const handler = createSubscriptionManagementHandler();
