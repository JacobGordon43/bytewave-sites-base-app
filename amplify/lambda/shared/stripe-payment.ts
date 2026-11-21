/**
 * Shared checkout validation and one-time payment persistence.
 * Subscription-specific database writes live in stripe-subscriptions.ts.
 */
import Stripe from "stripe";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "./environment";
import { ApiError, type TenantIdentity } from "./tenant-query";
import { reconcileSubscriptionSession, releaseSubscriptionCheckout } from "./stripe-subscriptions";

export const paymentDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
// Server-only secret. Network retries are bounded; session creation also uses an idempotency key.
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new ApiError(503, "Online payments are not configured yet.");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 10000 });
}
// Stored bill snapshot: dollar unit prices, app IDs, and the active checkout reservation.
export type StoredPayment = Record<string, unknown> & {
  id: string;
  businessId: string;
  clientId: string;
  status: string;
  platform: string;
  billingMode?: "payment" | "subscription";
  amount: number;
  items: {
    item: string;
    quantity: number;
    unitPrice: number;
    stripeTaxCode?: string;
    hosting?: boolean;
    recurring?: { interval: "month" | "year"; intervalCount: number };
  }[];
  stripeCheckoutAttempt?: string;
  stripeCheckoutStartedAt?: number;
  stripeSessionId?: string;
};

// A Stripe customer email is not the account identity. Match the bill's clientId
// against the authenticated Cognito subject, within the same business.
export function assertPaymentOwner(
  payment: StoredPayment | undefined,
  identity: TenantIdentity,
): asserts payment is StoredPayment {
  if (
    !payment ||
    payment.businessId !== identity.businessId ||
    payment.clientId !== identity.subject ||
    !identity.client
  ) {
    throw new ApiError(404, "Payment not found.");
  }
}
export async function loadPayment(businessId: string, id: string) {
  const result = await paymentDb.send(
    new GetCommand({
      TableName: getTableName("payments"),
      Key: { businessId, id },
      ConsistentRead: true,
    }),
  );
  return result.Item as StoredPayment | undefined;
}

/**
 * Convert the server-stored quote to Stripe line items and verify its total in cents.
 * Inline price_data preserves custom quotes and overrides even if the catalog changes.
 * Recurring cadence and hosting eligibility were validated when the bill was saved.
 */
export function paymentLineItems(
  payment: StoredPayment,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  if (payment.status !== "Pending" && payment.status !== "Overdue")
    throw new ApiError(409, "This payment is no longer outstanding.");
  if (payment.platform !== "Stripe")
    throw new ApiError(
      409,
      `This payment is arranged through ${payment.platform}. Please contact your service provider to change the payment method.`,
    );
  if (!Array.isArray(payment.items) || payment.items.length === 0 || payment.items.length > 100)
    throw new ApiError(409, "This payment needs valid line items before checkout.");
  let total = 0;
  const items = payment.items.map((item) => {
    const cents = Math.round(item.unitPrice * 100);
    if (
      typeof item.item !== "string" ||
      !item.item.trim() ||
      typeof item.unitPrice !== "number" ||
      !Number.isSafeInteger(cents) ||
      cents < 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new ApiError(
        409,
        "This payment has invalid line items. Please contact your service provider.",
      );
    }
    total += cents * item.quantity;
    // Charge the approved bill snapshot even if the catalog is later renamed or archived.
    if (
      payment.billingMode === "subscription" &&
      (!item.recurring ||
        !["month", "year"].includes(item.recurring.interval) ||
        !Number.isSafeInteger(item.recurring.intervalCount) ||
        item.recurring.intervalCount < 1 ||
        item.quantity !== 1 ||
        payment.items.length !== 1)
    )
      throw new ApiError(409, "Invalid subscription bill.");
    if (payment.billingMode !== "subscription" && item.recurring)
      throw new ApiError(409, "Recurring items require subscription checkout.");
    return {
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: cents,
        product_data: {
          name: item.item,
          ...(item.stripeTaxCode ? { tax_code: item.stripeTaxCode } : {}),
        },
        tax_behavior: "exclusive" as const,
        ...(payment.billingMode === "subscription" && item.recurring
          ? {
              recurring: {
                interval: item.recurring.interval,
                interval_count: item.recurring.intervalCount,
              },
            }
          : {}),
      },
    };
  });
  if (
    !Number.isSafeInteger(total) ||
    total < 50 ||
    total > 99999999 ||
    total !== Math.round(payment.amount * 100)
  ) {
    throw new ApiError(
      409,
      "The payment total needs review before checkout. Please contact your service provider.",
    );
  }
  return items;
}

// Return only the fields the checkout UI needs. An open session's client secret
// initializes Elements; completed/expired sessions no longer need a payment form.
export function sessionResult(session: Stripe.Checkout.Session) {
  return {
    sessionId: session.id,
    paymentId: session.metadata?.paymentId,
    clientSecret: session.status === "open" ? session.client_secret : null,
    status: session.status,
    paymentStatus: session.payment_status,
    billingMode: session.mode,
    interval: session.metadata?.interval,
    intervalCount: Number(session.metadata?.intervalCount || 1),
  };
}

// Both the EventBridge consumer and authenticated status endpoint use this operation.
// The attempt condition makes retries idempotent and excludes stale sessions.
export async function reconcileSession(session: Stripe.Checkout.Session) {
  const { businessId, paymentId: id, clientId, attempt } = session.metadata || {};
  if (!businessId || !id || !clientId || !attempt)
    throw new Error("Missing payment session metadata");
  const payment = await loadPayment(businessId, id);
  if (!payment || payment.clientId !== clientId || payment.stripeCheckoutAttempt !== attempt)
    throw new Error("Payment session does not match its stored payment");
  if (payment.billingMode === "subscription") {
    if (session.mode !== "subscription") throw new Error("Checkout mode does not match the bill");
    await reconcileSubscriptionSession(session);
    return;
  }
  // Checkout completion and payment settlement are different. A completed but
  // unpaid session must not mark a one-time bill paid.
  if (session.payment_status !== "paid") return;
  if (session.currency !== "usd" || session.amount_subtotal !== Math.round(payment.amount * 100))
    throw new Error("Stripe payment amount does not match the stored payment");
  // Replays may set the same paid values again, but preserve the first paidAt.
  // This is shared with browser status checks; do not attach an unconditional email here.
  await paymentDb.send(
    new UpdateCommand({
      TableName: getTableName("payments"),
      Key: { businessId, id },
      UpdateExpression:
        "SET #status = :completed, stripeSessionId = :session, stripePaymentIntentId = :intent, stripeAmountTotal = :total, stripeTaxAmount = :tax, paidAt = if_not_exists(paidAt, :now)",
      ConditionExpression:
        "stripeCheckoutAttempt = :attempt AND clientId = :client AND (#status = :pending OR #status = :overdue OR #status = :completed)",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":completed": "Completed",
        ":pending": "Pending",
        ":overdue": "Overdue",
        ":attempt": attempt,
        ":client": clientId,
        ":session": session.id,
        ":intent":
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || null,
        ":total": session.amount_total,
        ":tax": session.total_details?.amount_tax || 0,
        ":now": Date.now(),
      },
    }),
  );
}

/**
 * Clear only this expired attempt so the bill can be edited or checked out again.
 * Never clear a completed payment or a reservation owned by a newer attempt.
 */
export async function releaseExpiredSession(session: Stripe.Checkout.Session) {
  if (session.status !== "expired") return;
  const { businessId, paymentId: id, attempt } = session.metadata || {};
  if (!businessId || !id || !attempt) return;
  if (session.mode === "subscription") await releaseSubscriptionCheckout(businessId, id, attempt);
  try {
    await paymentDb.send(
      new UpdateCommand({
        TableName: getTableName("payments"),
        Key: { businessId, id },
        UpdateExpression: "REMOVE stripeCheckoutAttempt, stripeCheckoutStartedAt, stripeSessionId",
        ConditionExpression: "stripeCheckoutAttempt = :attempt AND #status <> :completed",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":attempt": attempt, ":completed": "Completed" },
      }),
    );
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "ConditionalCheckFailedException") throw error;
  }
}
