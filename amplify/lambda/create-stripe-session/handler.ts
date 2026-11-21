import { withCreateValidation } from "../shared/validate-create";
/**
 * POST /app/payments/stripe/session: prepare or reuse checkout for a saved bill.
 * This endpoint does not submit a payment; Stripe Elements confirms it in the browser.
 */
import { randomUUID } from "node:crypto";
import { reserveSubscription } from "../shared/stripe-subscriptions";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  ApiError,
  assertSafeIdentifier,
  getTenantIdentity,
  response,
} from "../shared/tenant-query";
import { getTableName } from "../shared/environment";
import type { AuthenticatedApiEvent } from "../shared/types";
import {
  assertPaymentOwner,
  loadPayment,
  paymentDb,
  paymentLineItems,
  reconcileSession,
  releaseExpiredSession,
  sessionResult,
  stripeClient,
} from "../shared/stripe-payment";

export const createSessionHandler =
  (getStripe = stripeClient) =>
  async (event: AuthenticatedApiEvent) => {
    let stage = "load-payment";
    try {
      const identity = getTenantIdentity(event);
      let input;
      try {
        input = JSON.parse(event.body || "{}");
      } catch {
        throw new ApiError(400, "Invalid request body.");
      }
      const paymentId = assertSafeIdentifier(input?.paymentId, "paymentId");
      let payment = await loadPayment(identity.businessId, paymentId);
      assertPaymentOwner(payment, identity);
      if (payment.status === "Canceled")
        throw new ApiError(
          409,
          "This subscription bill is canceled. Request a new bill to start a new subscription.",
        );
      if (payment.status === "Completed")
        return response(200, {
          success: true,
          result: {
            paymentId,
            sessionId: payment.stripeSessionId || "",
            status: "complete",
            paymentStatus: "paid",
            clientSecret: null,
          },
        });
      const stripe = getStripe();
      // Reuse an existing live/completed session on refresh. Only an expired session
      // can release the reservation and allow a fresh checkout attempt.
      if (payment.stripeSessionId) {
        stage = "retrieve-existing-session";
        const existing = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);
        if (existing.status !== "expired") {
          await reconcileSession(existing);
          return response(200, { success: true, result: sessionResult(existing) });
        }
        await releaseExpiredSession(existing);
        payment = await loadPayment(identity.businessId, paymentId);
        assertPaymentOwner(payment, identity);
      }
      const lineItems = paymentLineItems(payment);
      const origin = process.env.PAYMENT_SITE_ORIGIN;
      if (!origin || !/^https?:\/\//.test(origin))
        throw new ApiError(503, "Online payments are not configured yet.");
      // Reserve before calling Stripe. The condition checks that the bill has not
      // changed since we read it. This also freezes admin edits while checkout exists.
      if (!payment.stripeCheckoutAttempt) {
        stage = "reserve-checkout";
        const attempt = randomUUID();
        const started = Date.now();
        try {
          const reservation = new UpdateCommand({
            TableName: getTableName("payments"),
            Key: { businessId: identity.businessId, id: paymentId },
            UpdateExpression:
              "SET stripeCheckoutAttempt = :attempt, stripeCheckoutStartedAt = :started",
            ConditionExpression:
              "attribute_exists(id) AND attribute_not_exists(stripeCheckoutAttempt) AND #status = :status AND clientId = :client AND amount = :amount AND #items = :items AND platform = :platform",
            ExpressionAttributeNames: { "#status": "status", "#items": "items" },
            ExpressionAttributeValues: {
              ":attempt": attempt,
              ":started": started,
              ":status": payment.status,
              ":client": payment.clientId,
              ":amount": payment.amount,
              ":items": payment.items,
              ":platform": "Stripe",
            },
          });
          if (payment.billingMode === "subscription")
            await reserveSubscription(payment, attempt, reservation.input);
          else await paymentDb.send(reservation);
          payment.stripeCheckoutAttempt = attempt;
          payment.stripeCheckoutStartedAt = started;
        } catch (error) {
          if (!(error instanceof Error) || error.name !== "ConditionalCheckFailedException")
            throw error;
          throw new ApiError(
            409,
            "This payment is being prepared or was changed. Please try again.",
          );
        }
      }
      // Stripe retains idempotency keys for at least 24h. Never recreate an
      // unrecorded session after that window: it may already have charged.
      if (
        !payment.stripeCheckoutStartedAt ||
        Date.now() - payment.stripeCheckoutStartedAt > 23 * 60 * 60 * 1000
      ) {
        throw new ApiError(
          409,
          "This checkout needs review. Please contact your service provider before paying again.",
        );
      }
      // The attempt UUID is stable across retries. If Stripe created the session
      // but our database save failed, this key retrieves the same session on retry.
      stage = "create-stripe-session";
      const session = await stripe.checkout.sessions.create(
        {
          mode: payment.billingMode === "subscription" ? "subscription" : "payment",
          ui_mode: "elements",
          line_items: lineItems,
          // Subscription metadata survives checkout and links every renewal back to
          // the app's original bill/client. Session metadata alone would not do that.
          ...(payment.billingMode === "subscription"
            ? {
                subscription_data: {
                  metadata: {
                    businessId: identity.businessId,
                    paymentId,
                    clientId: payment.clientId,
                    attempt: payment.stripeCheckoutAttempt,
                    bytewaveSubscription: "1",
                  },
                },
              }
            : {}),
          allowed_payment_method_types: ["card"],
          return_url: `${origin.replace(/\/$/, "")}/client/payments/${encodeURIComponent(paymentId)}?session_id={CHECKOUT_SESSION_ID}`,
          client_reference_id: paymentId,
          // Use a stable server-side value for idempotent retries.
          metadata: {
            businessId: identity.businessId,
            paymentId,
            clientId: payment.clientId,
            attempt: payment.stripeCheckoutAttempt,
            ...(payment.items[0].recurring
              ? {
                  interval: payment.items[0].recurring.interval,
                  intervalCount: String(payment.items[0].recurring.intervalCount),
                }
              : {}),
          },
          automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
          billing_address_collection: "required",
        },
        { idempotencyKey: `payment-${payment.stripeCheckoutAttempt}` },
      );
      // Save Stripe's session ID only while this reservation still owns the bill.
      stage = "save-stripe-session";
      await paymentDb.send(
        new UpdateCommand({
          TableName: getTableName("payments"),
          Key: { businessId: identity.businessId, id: paymentId },
          UpdateExpression: "SET stripeSessionId = :session",
          ConditionExpression: "stripeCheckoutAttempt = :attempt",
          ExpressionAttributeValues: {
            ":session": session.id,
            ":attempt": payment.stripeCheckoutAttempt,
          },
        }),
      );
      stage = "reconcile-session";
      await reconcileSession(session);
      return response(200, { success: true, result: sessionResult(session) });
    } catch (error) {
      if (error instanceof ApiError)
        return response(error.statusCode, { success: false, message: error.message });
      // Include DynamoDB validation details without logging request bodies,
      // Stripe error payloads, keys, or session client secrets.
      console.error("CreateStripeSession failed", {
        stage,
        name: error instanceof Error ? error.name : "UnknownError",
        validationMessage:
          error instanceof Error && error.name === "ValidationException"
            ? error.message
            : undefined,
        requestId: event.requestContext.requestId,
      });
      return response(500, {
        success: false,
        message: "Unable to prepare checkout. Please try again or contact your service provider.",
      });
    }
  };

const validatedHandler = createSessionHandler();

export const handler = withCreateValidation("/app/payments/stripe/session", validatedHandler, "POST");
