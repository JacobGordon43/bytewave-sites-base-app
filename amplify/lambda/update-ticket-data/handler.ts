import { getTableName } from "../shared/environment";
import { ApiError } from "../shared/tenant-query";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const ALLOWED_ROLES = [
    "Bytewave-Admin",
    "Support",
    "Client"
];

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
        const isClient = roles.includes("Client") &&
            !roles.some((role) => role === "Bytewave-Admin" || role === "Support");

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
        if (!businessIdFromClaims) throw new Error("Missing business ID claim");
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
            throw new Error("Updates must be a JSON object");
        }

        if (isClient) {
            const subject = typeof claims.sub === "string" ? claims.sub : undefined;
            if (!subject) throw new ApiError(403, "The authenticated client is missing a user ID.");
            const recordKind = await authorizeClientTicketUpdate(
                businessIdFromClaims,
                subject,
                id,
            );
            assertClientUpdateFields(recordKind, updates);
        }

        updates.lastUpdated = new Date().getTime();

        const updateExpressionParts: string[] = [];
        const expressionAttributes: Record<string, unknown> = {};
        const expressionAttributeNames: Record<string, string> = {};

        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === "string" && value === "[object Object]") {
                throw new Error(`Invalid value for key ${key}: received "[object Object]" string.`);
            }
            if (key === "id" || key === "businessId" || key === "createdById") continue;

            const placeholder = `#${key}`;
            const valuePlaceholder = `:${key}`;
            updateExpressionParts.push(`${placeholder} = ${valuePlaceholder}`);
            expressionAttributeNames[placeholder] = key;
            expressionAttributes[valuePlaceholder] = value;
        }

        if (!updateExpressionParts.length) {
            throw new Error("No valid update fields provided");
        }

        const updateExpression = `SET ${updateExpressionParts.join(", ")}`;
        await dynamo.send(new UpdateCommand({
            TableName: getTableName("tickets"),
            Key: { businessId: businessIdFromClaims, id },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributes,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "UPDATED_NEW"
        }));

        body = { message: "The item was updated successfully", success: true };
    } catch (err: unknown) {
        statusCode = err instanceof ApiError ? err.statusCode : 400;
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

type ClientTicketRecordKind = "ticket" | "ticketMetadata" | "clientMetadata" | "businessMetadata";

async function authorizeClientTicketUpdate(
    businessId: string,
    subject: string,
    id: string,
): Promise<ClientTicketRecordKind> {
    if (id === `clientId_${subject}_metadata`) return "clientMetadata";
    if (id === `businessId_${businessId}_metadata`) return "businessMetadata";

    const ticketMetadataMatch = /^ticketId_(.+)_metadata$/.exec(id);
    const ticketId = ticketMetadataMatch?.[1] ?? id;
    const ticket = await dynamo.send(new GetCommand({
        TableName: getTableName("tickets"),
        Key: { businessId, id: ticketId },
        ProjectionExpression: "createdById",
    }));

    if (!ticket.Item) throw new ApiError(404, "The ticket was not found.");
    if (ticket.Item.createdById !== subject) {
        throw new ApiError(403, "Clients may only update their own tickets.");
    }
    return ticketMetadataMatch ? "ticketMetadata" : "ticket";
}

function assertClientUpdateFields(
    recordKind: ClientTicketRecordKind,
    updates: Record<string, unknown>,
) {
    const allowedFields = recordKind === "ticket"
        ? new Set(["status"])
        : recordKind === "businessMetadata" || recordKind === "clientMetadata"
          ? new Set(["lastUpdated"])
          : new Set(["lastUpdated", "status"]);

    const invalidField = Object.keys(updates).find((key) => !allowedFields.has(key));
    if (invalidField) {
        throw new ApiError(403, `Clients cannot update the ticket field ${invalidField}.`);
    }
}
