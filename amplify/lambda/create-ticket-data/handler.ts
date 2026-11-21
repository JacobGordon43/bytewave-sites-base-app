import { withCreateValidation } from "../shared/validate-create";
import { getTableName } from "../shared/environment";
import { ApiError, assertSafeIdentifier } from "../shared/tenant-query";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

const validatedHandler = async (event: AuthenticatedApiEvent) => {
    const headers = {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
    };

    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const allowedRoles = [
        "Bytewave-Admin",
        "Support",
        "Client"
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
        if (!businessIdFromClaims) throw new ApiError(403, "Missing business ID claim");
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

        if (!event.body) throw new ApiError(400, "Missing request body.")
        const responseBody = JSON.parse(event.body);
        const {item} = responseBody;
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new ApiError(400, "A ticket is required.")
        }

        const isClient = roles.includes("Client") &&
            !roles.some((role) => role === "Bytewave-Admin" || role === "Support");
        const subject = typeof claims.sub === "string" ? claims.sub : undefined;
        if (isClient) {
            if (!subject) throw new ApiError(403, "The authenticated client is missing a user ID.");
        }

        const id = assertSafeIdentifier(item.id, "ticket ID");
        const createdById = assertSafeIdentifier(
            isClient ? subject : item.createdById,
            "createdById",
        );
        if (typeof item.category !== "string" || !item.category.trim()) {
            throw new ApiError(400, "A ticket category is required.");
        }
        if (typeof item.description !== "string" || !item.description.trim()) {
            throw new ApiError(400, "A ticket description is required.");
        }

        const timestamp = Date.now();
        const tableName = getTableName("tickets");
        const ticket = {
            id,
            businessId: businessIdFromClaims,
            createdById,
            category: item.category.trim(),
            description: item.description.trim(),
            dateCreated: timestamp,
            status: "In Progress",
        };

        await dynamo.send(new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: tableName,
                        Item: ticket,
                        ConditionExpression: "attribute_not_exists(#businessId) AND attribute_not_exists(#id)",
                        ExpressionAttributeNames: {
                            "#businessId": "businessId",
                            "#id": "id",
                        },
                    },
                },
                {
                    Put: {
                        TableName: tableName,
                        Item: {
                            businessId: businessIdFromClaims,
                            id: `ticketId_${id}_metadata`,
                            lastUpdated: timestamp,
                            status: "In Progress",
                        },
                        ConditionExpression: "attribute_not_exists(#businessId) AND attribute_not_exists(#id)",
                        ExpressionAttributeNames: {
                            "#businessId": "businessId",
                            "#id": "id",
                        },
                    },
                },
                {
                    Update: {
                        TableName: tableName,
                        Key: {
                            businessId: businessIdFromClaims,
                            id: `clientId_${createdById}_metadata`,
                        },
                        UpdateExpression: "SET #lastUpdated = :lastUpdated",
                        ExpressionAttributeNames: { "#lastUpdated": "lastUpdated" },
                        ExpressionAttributeValues: { ":lastUpdated": timestamp },
                    },
                },
                {
                    Update: {
                        TableName: tableName,
                        Key: {
                            businessId: businessIdFromClaims,
                            id: `businessId_${businessIdFromClaims}_metadata`,
                        },
                        UpdateExpression: "SET #lastUpdated = :lastUpdated",
                        ExpressionAttributeNames: { "#lastUpdated": "lastUpdated" },
                        ExpressionAttributeValues: { ":lastUpdated": timestamp },
                    },
                },
            ],
        }));

        body = {
            message: "The ticket was added successfully",
            success: true,
            result: ticket,
        }
    } catch (err: unknown) {
        const transactionConflict = err instanceof Error &&
            (err.name === "TransactionCanceledException" || err.name === "TransactionConflictException");
        statusCode = err instanceof ApiError ? err.statusCode : transactionConflict ? 409 : 500
        body = {
            message: transactionConflict
                ? "The ticket already exists or could not be created because of a concurrent update."
                : getErrorMessage(err),
            success: false,
        }
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


export const handler = withCreateValidation("/app/support/tickets", validatedHandler, "POST");
