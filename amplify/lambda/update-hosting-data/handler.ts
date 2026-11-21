import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const ALLOWED_ROLES = [
    "Bytewave-Admin",
    "Support"
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

        const expectedEndTime = updates.expectedEndTime;
        delete updates.expectedEndTime;
        if (typeof expectedEndTime !== "number" || !Number.isSafeInteger(expectedEndTime)) throw new Error("Refresh hosting before editing it.");
        if (updates.endTime !== undefined && (!Number.isSafeInteger(updates.endTime) || updates.endTime < expectedEndTime)) throw new Error("Hosting edits cannot remove paid time.");
        if (updates.status === "Expired" && Math.max(expectedEndTime, updates.endTime || 0) > Date.now()) throw new Error("Paid hosting has not expired.");
        if (updates.status !== undefined && !["Active", "Expired"].includes(updates.status)) throw new Error("Invalid hosting status.");
        for (const key of Object.keys(updates)) {
            if (!["endTime", "status"].includes(key)) throw new Error(`Hosting field ${key} cannot be updated.`);
        }
        updates.lastUpdated = new Date().getTime();

        const updateExpressionParts: string[] = [];
        const expressionAttributes: Record<string, unknown> = {};
        const expressionAttributeNames: Record<string, string> = {};

        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === "string" && value === "[object Object]") {
                throw new Error(`Invalid value for key ${key}: received "[object Object]" string.`);
            }
            if (key === "id") continue;

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
        expressionAttributes[":expectedEndTime"] = expectedEndTime;
        await dynamo.send(new UpdateCommand({
            TableName: getTableName("hosting"),
            Key: { businessId: businessIdFromClaims, id },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributes,
            ExpressionAttributeNames: expressionAttributeNames,
            ConditionExpression: "attribute_exists(id) AND endTime = :expectedEndTime",
            ReturnValues: "UPDATED_NEW"
        }));

        body = { message: "The item was updated successfully", success: true };
    } catch (err: unknown) {
        statusCode = 400;
        body = { message: err instanceof Error && err.name === "ConditionalCheckFailedException" ? "Hosting changed while you were editing it. Refresh and try again." : getErrorMessage(err), success: false };
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
