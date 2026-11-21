import { validateCreateRequest } from "../../../shared/create-validation";
import { ApiError, assertSafeIdentifier } from "../shared/tenant-query";
import { normalizeBillItems, billTotalCents } from "../shared/stripe-catalog";
import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export const handler = async (event: AuthenticatedApiEvent) => {
    const headers = {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
    };

    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const allowedRoles = [
        "Bytewave-Admin"
    ];

    let statusCode = 200
    let body

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
        if(!roles.some(role=>allowedRoles.includes((role as string)))){
            return {
                "isBase64Encoded": false,
                statusCode: 403,
                headers,
                body: JSON.stringify({
                  success: false,
                  results: [],
                  message: "You do not have access to this data."
                })
            }
        }

        validateCreateRequest("/app/admin/payments", event.body ? JSON.parse(event.body) : undefined);
        if (!event.body) throw new Error("Missing request body")
        const responseBody = JSON.parse(event.body);
        const {item} = responseBody;
        if (!businessIdFromClaims) throw new ApiError(403, "Missing business ID claim.");
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new ApiError(400, "A payment is required.");
        assertSafeIdentifier(item.id, "payment ID");
        assertSafeIdentifier(item.clientId, "client ID");
        if (!["Stripe", "Zelle", "PayPal"].includes(item.platform)) throw new ApiError(400, "Invalid payment platform.");
        if (!Number.isSafeInteger(item.date) || item.date < 0) throw new ApiError(400, "A valid payment date is required.");
        const billingMode = item.billingMode || "payment";
        if (!["payment", "subscription"].includes(billingMode) || (billingMode === "subscription" && item.platform !== "Stripe")) throw new ApiError(400, "Subscriptions require Stripe.");
        // Save a server-verified quote, not browser-supplied totals, statuses or hosting flags.
        const items = await normalizeBillItems(item.items, businessIdFromClaims, undefined, billingMode === "subscription");
        const amountCents = billTotalCents(items);
        if (item.platform === "Stripe" && amountCents < 50) throw new ApiError(400, "Stripe bills must total at least $0.50 before tax.");
        const sanitizedItem = {
            id: item.id, businessId: businessIdFromClaims, clientId: item.clientId,
            date: item.date, platform: item.platform, status: "Pending", items,
            amountCents, amount: amountCents / 100, billingMode,
        };
        // Save the bill and billed-subtotal metric together. Creating a bill is not
        // payment confirmation and never grants hosting.
        const command = new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: getTableName("payments"),
                        Item: sanitizedItem,
                        ConditionExpression: "attribute_not_exists(#businessId) AND attribute_not_exists(#id)",
                        ExpressionAttributeNames: {
                            "#businessId": "businessId",
                            "#id": "id"
                        }
                    }
                },
                {
                    Update: {
                        TableName: getTableName("business-metrics"),
                        Key: {
                            businessId: businessIdFromClaims,
                            id: "revenue"
                        },
                        UpdateExpression: "ADD #totalRevenueCents :amountCents, #version :one", 
                        ExpressionAttributeNames:{ 
                            "#totalRevenueCents": "totalRevenueCents",
                            "#version" : "version"
                        },
                        ExpressionAttributeValues: {
                            ":amountCents": amountCents,
                            ":one": 1
                        }
                    }
                }
            ]
        })

        await dynamo.send(command)

        body = { message: "The item was added successfully", success: true, result: sanitizedItem }
    } catch (err: unknown) {
        statusCode = err instanceof ApiError ? err.statusCode : 400
        body = { message: getErrorMessage(err), success: false }
    } finally {
        body = JSON.stringify(body)
    }

    return {
        "isBase64Encoded": false,
        statusCode,
        body,
        headers
    }
}

