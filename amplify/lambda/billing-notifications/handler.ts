import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBRecord, DynamoDBStreamEvent, DynamoDBBatchResponse } from "aws-lambda";
import { getTableName } from "../shared/environment";
import { escapeEmailHtml, sendEmail, type EmailMessage } from "../shared/email";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
type Row = Record<string, string | number | boolean | undefined>;
export type Notice = {
  id: string;
  kind: "bill-posted" | "paid" | "canceled" | "expired";
  row: Row;
};

// Notifications only need scalar fields. Do not copy card data, full bill items or
// arbitrary nested attributes from stream records into the email/notification ledger.
function scalarImage(image: NonNullable<DynamoDBRecord["dynamodb"]>["NewImage"]): Row {
  return Object.fromEntries(
    Object.entries(image || {}).map(([key, value]) => [
      key,
      value.S ?? (value.N === undefined ? value.BOOL : Number(value.N)),
    ]),
  );
}

/** Select transitions from committed database changes, not from every Stripe delivery.
 * This also covers a one-time payment finalized by the browser's status endpoint.
 */
export function notificationFor(record: DynamoDBRecord): Notice | undefined {
  if (record.eventName !== "INSERT" && record.eventName !== "MODIFY") return;
  const row = scalarImage(record.dynamodb?.NewImage);
  const old = scalarImage(record.dynamodb?.OldImage);
  const table = record.eventSourceARN?.split(":table/")[1]?.split("/")[0];
  if (!row.businessId || !row.id || !row.clientId) return;

  if (table === getTableName("payments")) {
    if (record.eventName === "INSERT" && row.status === "Pending") {
      return { id: `bill-posted:${row.id}`, kind: "bill-posted", row };
    }
    if (row.status === "Completed" && old.status !== "Completed") {
      // Stable across webhook replays, status checks, and manual status toggles.
      return { id: `paid:${row.stripeInvoiceId || row.id}`, kind: "paid", row };
    }
  }
  if (table !== getTableName("subscription-state") || row.kind !== "subscription") return;
  // An event ID distinguishes cancel -> resume -> cancel, but is stable on retries.
  if (!record.eventID) throw new Error("Missing stream event ID");
  if (row.status === "incomplete_expired" && old.status !== row.status) {
    return { id: `expired:${record.eventID}`, kind: "expired", row };
  }
  if (row.status === "canceled" && old.status !== "canceled") {
    const kind = old.cancelAtPeriodEnd === true ? "expired" : "canceled";
    return { id: `${kind}:${record.eventID}`, kind, row };
  }
  if (
    row.cancelAtPeriodEnd === true &&
    old.cancelAtPeriodEnd !== true &&
    row.status !== "canceled"
  ) {
    return { id: `canceled:${record.eventID}`, kind: "canceled", row };
  }
}

export function notificationEmail(notice: Notice, client: Row): EmailMessage {
  const { row, kind } = notice;
  const name =
    [client.clientFirstName, client.clientLastName].filter(Boolean).join(" ") || "Client";
  const recipient =
    kind === "bill-posted"
      ? String(client.email || "")
      : kind === "paid"
        ? process.env.BILLING_NOTIFICATION_EMAIL || ""
        : process.env.HOSTING_NOTIFICATION_EMAIL || "";
  if (!recipient.trim())
    throw new Error("Client has no email address; notification requires review");
  const heading =
    kind === "bill-posted"
      ? "A new bill is ready"
      : kind === "paid"
        ? "Payment received"
        : kind === "expired"
          ? "Subscription ended or expired"
          : "Subscription cancellation";
  const details = [
    heading,
    `Client: ${name}`,
    `Client account: ${row.clientId}`,
    ...(client.businessName ? [`Client business: ${client.businessName}`] : []),
    `Bill: ${row.subscriptionSourceId || row.id}`,
    ...(row.name ? [`Service: ${row.name}`] : []),
    ...(row.stripeInvoiceId ? [`Stripe invoice: ${row.stripeInvoiceId}`] : []),
    ...(row.stripeSubscriptionId ? [`Stripe subscription: ${row.stripeSubscriptionId}`] : []),
  ];
  if (kind === "paid" || kind === "bill-posted") {
    const cents =
      kind === "paid" && typeof row.stripeAmountTotal === "number"
        ? row.stripeAmountTotal
        : Math.round(Number(row.amount) * 100);
    if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("Invalid notification amount");
    details.push(
      `Amount: USD ${(cents / 100).toFixed(2)}${kind === "bill-posted" && row.platform === "Stripe" ? " before applicable tax" : ""}`,
    );
    details.push(`Payment platform: ${row.platform}`);
  }
  if (kind === "bill-posted") {
    const origin = process.env.PAYMENT_SITE_ORIGIN;
    if (!origin || !/^https?:\/\//.test(origin))
      throw new Error("PAYMENT_SITE_ORIGIN is required for bill notifications");
    details.push(
      row.billingMode === "subscription"
        ? "Sign in to review and authorize the recurring subscription."
        : "Sign in to review your outstanding bill.",
    );
    const route =
      row.platform === "Stripe"
        ? `/client/payments/${encodeURIComponent(String(row.id))}`
        : "/client/payments";
    details.push(`View bill: ${origin.replace(/\/$/, "")}${route}`);
  }
  if (kind === "canceled" || kind === "expired") {
    details.push(`Subscription status: ${row.status}`);
    if (row.cancelAtPeriodEnd && row.status !== "canceled")
      details.push(
        "Future renewals have been canceled; the subscription remains active through its current period.",
      );
    if (typeof row.currentPeriodEnd === "number" && row.currentPeriodEnd > 0)
      details.push(`Stripe period end: ${new Date(row.currentPeriodEnd).toISOString()}`);
    details.push(
      "Already-paid hosting coverage is retained. Check the client's Hosting History before changing service.",
    );
  }
  return {
    fromEmail: process.env.BILLING_EMAIL_FROM || "",
    fromName: process.env.BUSINESS_NAME || "Website",
    toEmail: recipient,
    toName: kind === "bill-posted" ? name : (process.env.BUSINESS_NAME || "Website"),
    subject: `${heading} — ${row.id}`,
    textBody: details.join("\n"),
    htmlBody: details.map((line) => `<p>${escapeEmailHtml(line)}</p>`).join("\n"),
  };
}

export const createNotificationHandler =
  (send = sendEmail) =>
  async (event: DynamoDBStreamEvent): Promise<DynamoDBBatchResponse> => {
    for (const record of event.Records) {
      try {
        const notice = notificationFor(record);
        if (!notice) continue;
        const key = { businessId: notice.row.businessId, id: notice.id };
        const table = getTableName("billing-notifications");
        const token = randomUUID();
        const now = Date.now();
        // A short lease prevents concurrent workers/replays sending the same notice.
        // Sent rows are retained permanently so later replays remain deduplicated.
        try {
          await db.send(
            new UpdateCommand({
              TableName: table,
              Key: key,
              UpdateExpression:
                "SET leaseToken = :token, leaseUntil = :until, notificationKind = :kind",
              ConditionExpression:
                "attribute_not_exists(sentAt) AND (attribute_not_exists(leaseUntil) OR leaseUntil < :now)",
              ExpressionAttributeValues: {
                ":token": token,
                ":until": now + 120000,
                ":now": now,
                ":kind": notice.kind,
              },
            }),
          );
        } catch (error) {
          if (!(error instanceof Error) || error.name !== "ConditionalCheckFailedException")
            throw error;
          const existing = await db.send(
            new GetCommand({ TableName: table, Key: key, ConsistentRead: true }),
          );
          if (existing.Item?.sentAt) continue;
          throw new Error("Notification is being processed; retry after its lease");
        }
        try {
          const client = await db.send(
            new GetCommand({
              TableName: getTableName("clients"),
              Key: { businessId: notice.row.businessId, id: notice.row.clientId },
              ConsistentRead: true,
            }),
          );
          if (!client.Item) throw new Error("Client record missing; notification requires review");
          const messageId = await send(notificationEmail(notice, client.Item));
          await db.send(
            new UpdateCommand({
              TableName: table,
              Key: key,
              UpdateExpression:
                "SET sentAt = :sent, sesMessageId = :message REMOVE leaseToken, leaseUntil",
              ConditionExpression: "leaseToken = :token",
              ExpressionAttributeValues: {
                ":sent": Date.now(),
                ":message": messageId || "",
                ":token": token,
              },
            }),
          );
        } catch (error) {
          // Allow a retry without waiting for the lease when this invocation finishes.
          await db.send(
            new UpdateCommand({
              TableName: table,
              Key: key,
              UpdateExpression: "REMOVE leaseToken, leaseUntil",
              ConditionExpression: "leaseToken = :token",
              ExpressionAttributeValues: { ":token": token },
            }),
          );
          throw error;
        }
      } catch (error) {
        console.error("Billing notification failed", {
          eventId: record.eventID,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Stop at the first failure to preserve stream ordering. Lambda retries from
        // this sequence; already-sent notices are skipped using their ledger rows.
        if (!record.dynamodb?.SequenceNumber) throw error;
        return { batchItemFailures: [{ itemIdentifier: record.dynamodb.SequenceNumber }] };
      }
    }
    return { batchItemFailures: [] };
  };

export const handler = createNotificationHandler();
