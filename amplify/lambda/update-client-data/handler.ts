import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const ALLOWED_ROLES = [
    "Bytewave-Admin",
    "Client"
];

const ADMIN_MUTABLE_FIELDS = new Set([
    "clientFirstName",
    "clientLastName",
    "businessName",
    "email",
    "phone",
    "referred",
    "projectDescription",
    "services",
    "websiteUrl",
    "businessEmail",
    "status",
]);

const CLIENT_MUTABLE_FIELDS = new Set([
    "clientFirstName",
    "clientLastName",
    "businessName",
    "email",
    "phone",
    "businessEmail",
]);

function validateUpdateValue(field: string, value: unknown) {
    if (field === "referred") {
        if (typeof value !== "boolean") throw new Error("referred must be a boolean");
        return;
    }

    if (field === "services") {
        if (!Array.isArray(value) || value.some((service) => typeof service !== "string")) {
            throw new Error("services must be an array of strings");
        }
        return;
    }

    if (field === "status") {
        if (!new Set(["Active", "Inactive", "Past Due"]).has(String(value))) {
            throw new Error("status must be Active, Inactive, or Past Due");
        }
        return;
    }

    if (typeof value !== "string") throw new Error(`${field} must be a string`);
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
        const isAdmin = roles.includes("Bytewave-Admin");
        const isClient = roles.includes("Client") && !isAdmin;

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
        if(!businessIdFromClaims) throw new Error("Missing businessId from claims");
        const subject = typeof claims.sub === "string" ? claims.sub : undefined;
        if (isClient && (!subject || id !== subject)) {
            return {
                isBase64Encoded: false,
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Clients may only update their own client record."
                })
            };
        }
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
            throw new Error("Updates must be a JSON object");
        }

        const allowedFields = isAdmin ? ADMIN_MUTABLE_FIELDS : CLIENT_MUTABLE_FIELDS;
        const forbiddenFields = Object.keys(updates).filter((key) => !allowedFields.has(key));
        if (forbiddenFields.length > 0) {
            throw new Error(
                `The following client fields cannot be updated: ${forbiddenFields.sort().join(", ")}`
            );
        }

        updates.lastUpdated = new Date().getTime();

        const updateExpressionParts: string[] = [];
        const expressionAttributes: Record<string, unknown> = {};
        const expressionAttributeNames: Record<string, string> = {};

        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === "string" && value === "[object Object]") {
                throw new Error(`Invalid value for key ${key}: received "[object Object]" string.`);
            }
            if (key !== "lastUpdated") validateUpdateValue(key, value);

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
            TableName: getTableName("clients"),
            Key: { businessId: businessIdFromClaims, id },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributes,
            ExpressionAttributeNames: expressionAttributeNames,
            ConditionExpression: "attribute_exists(businessId) AND attribute_exists(id)",
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
