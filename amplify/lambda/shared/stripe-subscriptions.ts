/**
 * Subscription persistence and paid hosting coverage.
 * Entry points: create-stripe-session reserves an offer; checkout/status requests
 * sync Stripe IDs and status; stripe-webhook processes invoices and lifecycle events.
 * Only reconcileSubscriptionInvoice writes hosting or paid subscription receipts.
 * See docs/stripe-code-guide.md for the complete call flow and table layout.
 */
import type Stripe from "stripe";
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  DeleteCommand,
  type UpdateCommandInput,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { getTableName } from "./environment";
import { ApiError } from "./tenant-query";
import { paymentDb, loadPayment, stripeClient, type StoredPayment } from "./stripe-payment";

// The subscription row uses the ORIGINAL app bill ID, not Stripe's sub_... ID.
// Money in amount is USD dollars. Our timestamps are milliseconds; Stripe uses seconds.
// paidThrough is the latest paid Stripe period end; hostingOffset is extra prepaid time.
// version protects invoice updates from overwriting a concurrent renewal.
export type SubscriptionState = {
  businessId: string;
  id: string;
  kind: "subscription";
  clientId: string;
  attempt: string;
  name: string;
  amount: number;
  interval: string;
  intervalCount: number;
  hosting: boolean;
  status: string;
  stripeSubscriptionId?: string;
  customerId?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  paidThrough?: number;
  hostingOffset?: number;
  hostingId?: string;
  version: number;
};
type HostingRecord = {
  businessId: string;
  id: string;
  clientId: string;
  startTime: number;
  endTime: number;
  selfHosted: boolean;
  status: string;
};
// This table contains three kinds of rows under each businessId:
// original bill ID -> subscription; hosting:<clientId> -> reservation lock;
// invoice:<Stripe invoice ID> -> marker for an already-processed paid invoice.
const stateTable = () => getTableName("subscription-state");
// Stripe expandable fields can contain either an ID string or an expanded object.
export const objectId = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;
/** Read the app's subscription row, including writes that just completed. */
export async function subscriptionState(businessId: string, id: string) {
  return (
    await paymentDb.send(
      new GetCommand({ TableName: stateTable(), Key: { businessId, id }, ConsistentRead: true }),
    )
  ).Item as SubscriptionState | undefined;
}

/**
 * Reserve the bill and subscription before requesting a Stripe session.
 * All writes succeed together, so concurrent checkouts cannot claim the same offer.
 * The caller supplies the conditional payment reservation as part of this transaction.
 */
export async function reserveSubscription(
  payment: StoredPayment,
  attempt: string,
  reservation: UpdateCommandInput,
) {
  const item = payment.items[0];
  if (!item.recurring || payment.items.length !== 1 || item.quantity !== 1)
    throw new ApiError(400, "Invalid recurring bill.");
  const state: SubscriptionState = {
    businessId: payment.businessId,
    id: payment.id,
    kind: "subscription",
    clientId: payment.clientId,
    attempt,
    name: item.item,
    amount: payment.amount,
    interval: item.recurring.interval,
    intervalCount: item.recurring.intervalCount,
    hosting: item.hosting === true,
    status: "checkout_pending",
    version: 0,
  };
  const writes: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
    {
      Update: {
        ...reservation,
        TableName: reservation.TableName!,
        Key: reservation.Key!,
        UpdateExpression: reservation.UpdateExpression!,
      },
    },
    {
      Put: {
        TableName: stateTable(),
        Item: state,
        ConditionExpression: "attribute_not_exists(id)",
      },
    },
  ];
  // Hosting clients may hold only one pending/active hosting subscription at a time.
  // This separate per-client row also blocks two DIFFERENT bills from racing.
  if (state.hosting)
    writes.push({
      Put: {
        TableName: stateTable(),
        Item: {
          businessId: payment.businessId,
          id: `hosting:${payment.clientId}`,
          paymentId: payment.id,
          attempt,
          kind: "lock",
        },
        ConditionExpression: "attribute_not_exists(id)",
      },
    });
  try {
    await paymentDb.send(new TransactWriteCommand({ TransactItems: writes }));
  } catch (error) {
    if (error instanceof Error && error.name === "TransactionCanceledException")
      throw new ApiError(
        409,
        "A hosting subscription or checkout may already exist for this client. Review subscriptions or expire the previous checkout before retrying.",
      );
    throw error;
  }
}

/**
 * Release a checkout that expired before it became a Stripe subscription.
 * Matching the attempt prevents an old expiry event from deleting a newer reservation.
 */
export async function releaseSubscriptionCheckout(businessId: string, id: string, attempt: string) {
  const state = await subscriptionState(businessId, id);
  if (!state || state.attempt !== attempt || state.stripeSubscriptionId) return;
  const writes: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
    {
      Delete: {
        TableName: stateTable(),
        Key: { businessId, id },
        ConditionExpression: "attempt = :attempt AND attribute_not_exists(stripeSubscriptionId)",
        ExpressionAttributeValues: { ":attempt": attempt },
      },
    },
  ];
  if (state.hosting)
    writes.push({
      Delete: {
        TableName: stateTable(),
        Key: { businessId, id: `hosting:${state.clientId}` },
        ConditionExpression: "attempt = :attempt",
        ExpressionAttributeValues: { ":attempt": attempt },
      },
    });
  await paymentDb.send(new TransactWriteCommand({ TransactItems: writes }));
}

/**
 * Copy Stripe lifecycle state and customer/subscription IDs into our reservation.
 * Being active is not proof of a paid invoice, so this does not grant hosting.
 * The app marker plus stored reservation ties Stripe metadata to a known client/bill.
 */
export async function syncSubscription(subscription: Stripe.Subscription) {
  const { businessId, paymentId, clientId, attempt, bytewaveSubscription } = subscription.metadata;
  if (bytewaveSubscription !== "1") return undefined;
  if (!businessId || !paymentId || !clientId || !attempt)
    throw new Error("Incomplete subscription metadata");
  const state = await subscriptionState(businessId, paymentId);
  if (
    !state ||
    state.clientId !== clientId ||
    state.attempt !== attempt ||
    (state.stripeSubscriptionId && state.stripeSubscriptionId !== subscription.id)
  )
    throw new Error("Subscription does not match its checkout reservation");
  const periodEnd =
    Math.max(0, ...subscription.items.data.map((item) => item.current_period_end)) * 1000;
  await paymentDb.send(
    new UpdateCommand({
      TableName: stateTable(),
      Key: { businessId, id: paymentId },
      UpdateExpression:
        "SET stripeSubscriptionId = :sub, customerId = :customer, #status = :status, currentPeriodEnd = :end, cancelAtPeriodEnd = :cancel",
      ConditionExpression:
        "attempt = :attempt AND (attribute_not_exists(stripeSubscriptionId) OR stripeSubscriptionId = :sub)",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":sub": subscription.id,
        ":customer": objectId(subscription.customer),
        ":status": subscription.status,
        ":end": periodEnd,
        ":cancel": subscription.cancel_at_period_end,
        ":attempt": attempt,
      },
    }),
  );
  // Terminal subscriptions release the per-client lock so a new subscription can start.
  // Period-end cancellation is still active until then. Existing hosting remains intact.
  if (state.hosting && ["canceled", "incomplete_expired"].includes(subscription.status)) {
    try {
      await paymentDb.send(
        new DeleteCommand({
          TableName: stateTable(),
          Key: { businessId, id: `hosting:${clientId}` },
          ConditionExpression: "paymentId = :id AND attempt = :attempt",
          ExpressionAttributeValues: { ":id": paymentId, ":attempt": attempt },
        }),
      );
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "ConditionalCheckFailedException")
        throw error;
    }
  }
  return {
    ...state,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

/**
 * Hide an unpaid offer when its subscription ends without an initial paid invoice.
 * The condition leaves completed receipts alone, including if an invoice wins the race.
 */
export async function closeUnpaidSubscriptionBill(subscription: Stripe.Subscription) {
  if (
    subscription.metadata.bytewaveSubscription !== "1" ||
    !["canceled", "incomplete_expired"].includes(subscription.status)
  )
    return;
  const { businessId, paymentId, attempt } = subscription.metadata;
  try {
    await paymentDb.send(
      new UpdateCommand({
        TableName: getTableName("payments"),
        Key: { businessId, id: paymentId },
        UpdateExpression: "SET #status = :canceled",
        ConditionExpression:
          "stripeCheckoutAttempt = :attempt AND attribute_not_exists(stripeInvoiceId) AND (#status = :pending OR #status = :overdue)",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":canceled": "Canceled",
          ":attempt": attempt,
          ":pending": "Pending",
          ":overdue": "Overdue",
        },
      }),
    );
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "ConditionalCheckFailedException") throw error;
  }
}

// Query every page: DynamoDB filters by client AFTER reading the business partition.
// Extend the record with the furthest end date, excluding self-hosted arrangements.
async function latestManagedHosting(businessId: string, clientId: string) {
  const records: HostingRecord[] = [];
  let cursor: Record<string, unknown> | undefined;
  do {
    const page = await paymentDb.send(
      new QueryCommand({
        TableName: getTableName("hosting"),
        KeyConditionExpression: "businessId = :business",
        FilterExpression: "clientId = :client",
        ExpressionAttributeValues: { ":business": businessId, ":client": clientId },
        ConsistentRead: true,
        ExclusiveStartKey: cursor,
      }),
    );
    records.push(...((page.Items || []) as HostingRecord[]));
    cursor = page.LastEvaluatedKey;
  } while (cursor);
  return records
    .filter((record) => !record.selfHosted)
    .sort((a, b) => Number(b.endTime) - Number(a.endTime) || b.startTime - a.startTime)[0];
}

// A monotonic paid-through date makes duplicate and out-of-order invoice delivery harmless.
// Carry existing prepaid/manual time forward without treating it as a Stripe billing date.
export function hostingEntitlement(
  state: SubscriptionState,
  hosting: HostingRecord | undefined,
  subscriptionStart: number,
  periodEnd: number,
) {
  // Example: 10 prepaid days at signup become an offset of 10 days. Each paid
  // Stripe period end keeps that offset, rather than consuming it on the first renewal.
  const previous = state.paidThrough || subscriptionStart;
  let offset =
    state.hostingOffset ?? Math.max(0, Number(hosting?.endTime || 0) - subscriptionStart);
  // If an admin extended hosting since the last invoice, preserve that extra time too.
  if (state.paidThrough)
    offset += Math.max(0, Number(hosting?.endTime || 0) - (state.paidThrough + offset));
  const paidThrough = Math.max(previous, periodEnd);
  return {
    paidThrough,
    offset,
    endTime: Math.max(Number(hosting?.endTime || 0), paidThrough + offset),
  };
}

/**
 * Apply one paid subscription invoice to our records.
 * Failed/action-required invoices still sync lifecycle state, then return without a grant.
 * A paid invoice commits its marker, coverage, subscription progress and receipt atomically.
 */
export async function reconcileSubscriptionInvoice(
  invoice: Stripe.Invoice,
  stripe = stripeClient(),
) {
  const subscriptionId = objectId(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const synced = await syncSubscription(subscription);
  if (!synced || invoice.status !== "paid") return;
  // We support the initial invoice and normal renewals only. A changed/prorated
  // invoice needs review instead of silently granting time for an unexpected charge.
  if (!["subscription_create", "subscription_cycle"].includes(invoice.billing_reason || ""))
    throw new Error("Subscription adjustments require manual review; hosting was not extended");
  if (invoice.currency !== "usd") throw new Error("Unexpected subscription invoice currency");
  // Fetch all invoice lines; the embedded Stripe list can be paginated.
  // Compare the pre-tax line amount to the agreed bill, not a possibly discounted total.
  const lines: Stripe.InvoiceLineItem[] = [];
  for await (const line of stripe.invoices.listLineItems(invoice.id, { limit: 100 }))
    lines.push(line);
  if (
    lines.length !== 1 ||
    lines[0].parent?.subscription_item_details?.proration ||
    lines[0].quantity !== 1 ||
    lines[0].amount !== Math.round(synced.amount * 100)
  )
    throw new Error("Subscription invoice does not match the approved recurring bill");
  const line = lines[0];
  if (
    line.parent?.subscription_item_details?.subscription !== subscriptionId ||
    !Number.isSafeInteger(line.period.end) ||
    line.period.end <= line.period.start
  )
    throw new Error("Invalid subscription invoice period");
  const { businessId, id: paymentId, clientId } = synced;
  const markerId = `invoice:${invoice.id}`;
  // Retry a conflicting transaction using freshly read state. A duplicate invoice
  // exits via its marker; concurrent invoices/manual hosting edits must be recalculated.
  for (let retry = 0; retry < 5; retry++) {
    if (
      (
        await paymentDb.send(
          new GetCommand({
            TableName: stateTable(),
            Key: { businessId, id: markerId },
            ConsistentRead: true,
          }),
        )
      ).Item
    )
      return;
    const state = await subscriptionState(businessId, paymentId);
    const payment = await loadPayment(businessId, paymentId);
    if (
      !state ||
      !payment ||
      payment.billingMode !== "subscription" ||
      payment.clientId !== clientId ||
      payment.stripeCheckoutAttempt !== state.attempt
    )
      throw new Error("Subscription bill is missing or does not match");
    const initial = invoice.billing_reason === "subscription_create";
    const tax = (invoice.total_taxes || []).reduce((sum, value) => sum + value.amount, 0);
    // Write 1: claim this invoice exactly once. This marker is committed only if
    // every other write succeeds, so a failed transaction remains safe to retry.
    const writes: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
      {
        Put: {
          TableName: stateTable(),
          Item: { businessId, id: markerId, kind: "invoice", invoiceId: invoice.id, paymentId },
          ConditionExpression: "attribute_not_exists(id)",
        },
      },
    ];
    let entitlement = {
      paidThrough: Math.max(state.paidThrough || 0, line.period.end * 1000),
      offset: state.hostingOffset || 0,
      endTime: 0,
    };
    let hostingId = state.hostingId || "";
    // Write 2 (hosting products only): create coverage or extend the latest record.
    // Compare its old endTime before replacing it to preserve concurrent manual edits.
    if (state.hosting) {
      const existing = await latestManagedHosting(businessId, clientId);
      entitlement = hostingEntitlement(
        state,
        existing,
        subscription.start_date * 1000,
        line.period.end * 1000,
      );
      hostingId = existing?.id || `stripe-hosting-${clientId}`;
      const hosting = {
        ...(existing || {
          businessId,
          id: hostingId,
          clientId,
          startTime: line.period.start * 1000,
          selfHosted: false,
        }),
        endTime: entitlement.endTime,
        status: entitlement.endTime > Date.now() ? "Active" : "Expired",
        lastUpdated: Date.now(),
      };
      writes.push({
        Put: {
          TableName: getTableName("hosting"),
          Item: hosting,
          ConditionExpression: existing
            ? "endTime = :end AND clientId = :client AND selfHosted = :self"
            : "attribute_not_exists(id)",
          ...(existing
            ? {
                ExpressionAttributeValues: {
                  ":end": existing.endTime,
                  ":client": clientId,
                  ":self": false,
                },
              }
            : {}),
        },
      });
    }
    // Write 3: advance paid-through state only if no other invoice changed version.
    writes.push({
      Update: {
        TableName: stateTable(),
        Key: { businessId, id: paymentId },
        UpdateExpression:
          "SET paidThrough = :through, hostingOffset = :offset, hostingId = :hosting, #version = :next",
        ConditionExpression: "#version = :version AND attempt = :attempt",
        ExpressionAttributeNames: { "#version": "version" },
        ExpressionAttributeValues: {
          ":through": entitlement.paidThrough,
          ":offset": entitlement.offset,
          ":hosting": hostingId,
          ":version": state.version,
          ":next": state.version + 1,
          ":attempt": state.attempt,
        },
      },
    });
    // Write 4: the first invoice completes the existing bill; renewals create a
    // separate receipt using the invoice ID, preserving the original bill as the link.
    if (initial)
      writes.push({
        Update: {
          TableName: getTableName("payments"),
          Key: { businessId, id: paymentId },
          UpdateExpression:
            "SET #status = :completed, stripeInvoiceId = :invoice, stripeSubscriptionId = :sub, stripeAmountTotal = :total, stripeTaxAmount = :tax, paidAt = :paid",
          ConditionExpression: "stripeCheckoutAttempt = :attempt",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: {
            ":completed": "Completed",
            ":invoice": invoice.id,
            ":sub": subscriptionId,
            ":total": invoice.total,
            ":tax": tax,
            ":paid": (invoice.status_transitions.paid_at || invoice.created) * 1000,
            ":attempt": state.attempt,
          },
        },
      });
    else {
      writes.push({
        Put: {
          TableName: getTableName("payments"),
          Item: {
            businessId,
            id: `stripe-invoice-${invoice.id}`,
            clientId,
            amount: invoice.subtotal / 100,
            amountCents: invoice.subtotal,
            date: (invoice.status_transitions.paid_at || invoice.created) * 1000,
            items: payment.items,
            platform: "Stripe",
            status: "Completed",
            subscriptionSourceId: paymentId,
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscriptionId,
            stripeAmountTotal: invoice.total,
            stripeTaxAmount: tax,
          },
          ConditionExpression: "attribute_not_exists(id)",
        },
      });
      // The original bill already increased this metric when the admin created it.
      // Only renewal receipts add here. This existing metric tracks billed subtotals,
      // not cash received, and deliberately excludes Stripe tax.
      writes.push({
        Update: {
          TableName: getTableName("business-metrics"),
          Key: { businessId, id: "revenue" },
          UpdateExpression: "ADD totalRevenueCents :amount, #version :one",
          ExpressionAttributeNames: { "#version": "version" },
          ExpressionAttributeValues: { ":amount": invoice.subtotal, ":one": 1 },
        },
      });
    }
    // Commit everything together. Do not mark an invoice handled before its hosting
    // and receipt writes succeed; otherwise a retry could silently skip missing work.
    try {
      await paymentDb.send(new TransactWriteCommand({ TransactItems: writes }));
      return;
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "TransactionCanceledException" || retry === 4)
        throw error;
    }
  }
}

/**
 * Checkout/browser reconciliation only: verify the session and sync its subscription.
 * Invoice events can arrive before or after this call; neither order grants time twice.
 */
export async function reconcileSubscriptionSession(
  session: Stripe.Checkout.Session,
  stripe = stripeClient(),
) {
  const id = objectId(session.subscription);
  if (!id) return;
  const subscription = await stripe.subscriptions.retrieve(id);
  if (
    subscription.metadata.attempt !== session.metadata?.attempt ||
    subscription.metadata.paymentId !== session.metadata?.paymentId
  )
    throw new Error("Subscription session metadata mismatch");
  await syncSubscription(subscription);
  // Hosting and paid receipts are written exclusively by invoice events, never by browser requests.
}
