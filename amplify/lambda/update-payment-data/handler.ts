import { normalizeBillItems } from "../shared/stripe-catalog";
import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const ALLOWED_ROLES = [
    "Bytewave-Admin"
];

type PaymentItem = {
    id: string;
    item: string;
    unitPrice: number;
    quantity: number;
};

const PAYMENT_STATUSES = new Set(["Completed", "Pending", "Overdue"]);
const PAYMENT_PLATFORMS = new Set(["Zelle", "PayPal", "Stripe"]);

function parseAmountCents(value: unknown) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error("Payment amount must be a valid non-negative number.");
    }

    const amountCents = Math.round(value * 100);
    if (!Number.isSafeInteger(amountCents)) {
        throw new Error("Payment amount is outside the supported range.");
    }

    return amountCents;
}

function calculateItemsAmountCents(items: PaymentItem[]) {
    const amountCents = items.reduce((total, item) => {
        const lineTotal = parseAmountCents(item.unitPrice) * item.quantity;
        const nextTotal = total + lineTotal;

        if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(nextTotal)) {
            throw new Error("Payment amount is outside the supported range.");
        }

        return nextTotal;
    }, 0);

    return amountCents;
}

export const handler = async (event: AuthenticatedApiEvent) => {
    const headers = {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,PUT",
    };

    const claims = event.requestContext?.authorizer?.jwt?.claims;

    let statusCode = 200;
    let body;

    try {
                if (!claims) {
          return {
            isBase64Encoded: false,
            statusCode: 403,
            headers,
            body: JSON.stringify({
              success: false,
              results: [],
              message: "No claims data was found. Please contact your administrator."
            })
          };
        }

        const businessIdFromClaims = getBusinessIdFromClaims(claims);
        const roles = getRolesFromClaims(claims);

        if (!businessIdFromClaims) throw new Error("Missing business ID claim");

        if (!roles.some(role => ALLOWED_ROLES.includes(role as string))) {
          return {
            isBase64Encoded: false,
            statusCode: 403,
            headers,
            body: JSON.stringify({
              success: false,
              message: "You do not have access to this data."
            })
          };
        }

        if (!event.body) throw new Error("Missing request body");

        const requestBody = JSON.parse(event.body);
        const { id, updates } = requestBody;

        if (!id) throw new Error("Missing item id");
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
            throw new Error("Updates must be a JSON object");
        }

        const paymentsTableName = getTableName("payments");
        const paymentKey = { businessId: businessIdFromClaims, id };
        const paymentResponse = await dynamo.send(new GetCommand({
            TableName: paymentsTableName,
            Key: paymentKey,
            ConsistentRead: true,
        }));

        const existingPayment = paymentResponse.Item;
        const sanitizedUpdates: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(updates)) {
            switch (key) {
                case "clientId":
                    if (typeof value !== "string" || !value.trim()) {
                        throw new Error("A valid client ID is required.");
                    }
                    sanitizedUpdates.clientId = value.trim();
                    break;
                case "status":
                    if (typeof value !== "string" || !PAYMENT_STATUSES.has(value)) {
                        throw new Error("Payment status is invalid.");
                    }
                    sanitizedUpdates.status = value;
                    break;
                case "platform":
                    if (typeof value !== "string" || !PAYMENT_PLATFORMS.has(value)) {
                        throw new Error("Payment platform is invalid.");
                    }
                    sanitizedUpdates.platform = value;
                    break;
                case "date":
                    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
                        throw new Error("Payment date must be a valid timestamp.");
                    }
                    sanitizedUpdates.date = value;
                    break;
                case "items":
                    sanitizedUpdates.items = await normalizeBillItems(value, businessIdFromClaims, undefined, existingPayment?.billingMode === "subscription");
                    break;
                default:
                    throw new Error(`Payment field ${key} cannot be updated.`);
            }
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            throw new Error("No valid payment updates were provided.");
        }

        if (sanitizedUpdates.items) {
            const amountCents = calculateItemsAmountCents(
                sanitizedUpdates.items as PaymentItem[],
            );
            sanitizedUpdates.amount = amountCents / 100;
            sanitizedUpdates.amountCents = amountCents;
        }

        sanitizedUpdates.lastUpdated = Date.now();

        if (!existingPayment) {
            statusCode = 404;
            body = { message: "The payment could not be found", success: false };
        } else {
            // Freeze a quote once checkout starts, and preserve invoice-backed receipts.
            // The transaction also checks these fields to catch a checkout starting concurrently.
            if (existingPayment.stripeCheckoutAttempt || existingPayment.stripeInvoiceId) {
                throw new Error("This payment has an active or completed Stripe checkout and cannot be edited. Expire an unpaid session in Stripe and wait for its webhook before editing.");
            }
            if (existingPayment.billingMode === "subscription" && (sanitizedUpdates.platform || existingPayment.platform) !== "Stripe") throw new Error("Subscriptions require Stripe.");
            const storedAmountCents = existingPayment.amountCents;
            const existingAmountCents = Number.isSafeInteger(storedAmountCents)
                ? storedAmountCents
                : parseAmountCents(Number(existingPayment.amount));
            const updatedAmountCents = sanitizedUpdates.amountCents === undefined
                ? existingAmountCents
                : sanitizedUpdates.amountCents as number;
            const revenueDifference = updatedAmountCents - existingAmountCents;
            if ((sanitizedUpdates.platform || existingPayment.platform) === "Stripe" && updatedAmountCents < 50) {
                throw new Error("Stripe bills must total at least $0.50 before tax.");
            }

            if (!Number.isSafeInteger(revenueDifference)) {
                throw new Error("Payment amount difference is outside the supported range.");
            }

            const updateExpressionParts: string[] = [];
            const expressionAttributeNames: Record<string, string> = {
                "#recordId": "id",
            };
            const expressionAttributeValues: Record<string, unknown> = {};

            Object.entries(sanitizedUpdates).forEach(([key, value], index) => {
                const namePlaceholder = `#field${index}`;
                const valuePlaceholder = `:value${index}`;
                updateExpressionParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
                expressionAttributeNames[namePlaceholder] = key;
                expressionAttributeValues[valuePlaceholder] = value;
            });

            let paymentCondition = "attribute_exists(#recordId) AND attribute_not_exists(stripeCheckoutAttempt) AND attribute_not_exists(stripeInvoiceId)";
            if (revenueDifference !== 0) {
                expressionAttributeNames["#existingAmountCents"] = "amountCents";

                if (Number.isSafeInteger(storedAmountCents)) {
                    paymentCondition += " AND #existingAmountCents = :expectedAmountCents";
                    expressionAttributeValues[":expectedAmountCents"] = existingAmountCents;
                } else {
                    expressionAttributeNames["#existingAmount"] = "amount";
                    paymentCondition +=
                        " AND attribute_not_exists(#existingAmountCents) AND #existingAmount = :expectedAmount";
                    expressionAttributeValues[":expectedAmount"] = Number(existingPayment.amount);
                }
            }

            const transactItems = [
                {
                    Update: {
                        TableName: paymentsTableName,
                        Key: paymentKey,
                        UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
                        ConditionExpression: paymentCondition,
                        ExpressionAttributeNames: expressionAttributeNames,
                        ExpressionAttributeValues: expressionAttributeValues,
                    },
                },
            ];

            if (revenueDifference !== 0) {
                const metricExpressionValues: Record<string, number> = {
                    ":revenueDifference": revenueDifference,
                    ":one": 1,
                };
                let metricCondition = "attribute_exists(#totalRevenueCents)";

                if (revenueDifference < 0) {
                    metricCondition += " AND #totalRevenueCents >= :amountToRemove";
                    metricExpressionValues[":amountToRemove"] = -revenueDifference;
                }

                transactItems.push({
                    Update: {
                        TableName: getTableName("business-metrics"),
                        Key: {
                            businessId: businessIdFromClaims,
                            id: "revenue",
                        },
                        UpdateExpression:
                            "ADD #totalRevenueCents :revenueDifference, #version :one",
                        ConditionExpression: metricCondition,
                        ExpressionAttributeNames: {
                            "#totalRevenueCents": "totalRevenueCents",
                            "#version": "version",
                        },
                        ExpressionAttributeValues: metricExpressionValues,
                    },
                });
            }

            await dynamo.send(new TransactWriteCommand({ TransactItems: transactItems }));
            body = { message: "The payment was updated successfully", success: true, result: { ...existingPayment, ...sanitizedUpdates } };
        }
    } catch (err: unknown) {
        statusCode = err instanceof Error && err.name === "TransactionCanceledException"
            ? 409
            : 400;
        body = { message: getErrorMessage(err), success: false };
    } finally {
        body = JSON.stringify(body);
    }

    return {
        isBase64Encoded: false,
        statusCode,
        body,
        headers
    };
};
