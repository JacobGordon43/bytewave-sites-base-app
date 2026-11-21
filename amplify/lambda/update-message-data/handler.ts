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
        await dynamo.send(new UpdateCommand({
            TableName: getTableName("messages"),
            Key: { businessId: businessIdFromClaims, id },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributes,
            ExpressionAttributeNames: expressionAttributeNames,
            ReturnValues: "UPDATED_NEW"
        }));

        body = { message: "The item was updated successfully", success: true };
    } catch (err: unknown) {
        statusCode = 400;
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
