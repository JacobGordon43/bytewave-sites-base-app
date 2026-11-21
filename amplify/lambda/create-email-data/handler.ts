import { withCreateValidation } from "../shared/validate-create";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ALLOWED_ROLES = ["Bytewave-Admin", "Admin"];

const validatedHandler = async (event: AuthenticatedApiEvent) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };

  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) throw new Error("No authorization claims were found.");
    if (!getRolesFromClaims(claims).some((role) => ALLOWED_ROLES.includes(role))) {
      throw new Error("You do not have access to this data.");
    }
    const businessId = getBusinessIdFromClaims(claims);
    if (!businessId) throw new Error("Missing business ID claim.");

    if (!event.body) throw new Error("Missing request body.");
    const body: unknown = JSON.parse(event.body);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Request body must be a JSON object.");
    }

    const request = body as Record<string, unknown>;
    const item = request.item;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("item must be a JSON object.");
    }

    const requestedItem = item as Record<string, unknown>;
    const email = requireString(requestedItem.email, "item.email").toLowerCase();
    const now = Date.now();
    const savedItem = Object.fromEntries(
      Object.entries({
        ...requestedItem,
        id: typeof requestedItem.id === "string" && requestedItem.id.trim()
          ? requestedItem.id.trim()
          : randomUUID(),
        businessId,
        email,
        subscribed: typeof requestedItem.subscribed === "boolean"
          ? requestedItem.subscribed
          : true,
        createdAt: typeof requestedItem.createdAt === "number"
          ? requestedItem.createdAt
          : now,
        lastUpdated: now,
      }).filter(([, value]) => value !== undefined),
    );

    await dynamo.send(new PutCommand({
      TableName: getTableName("emails"),
      Item: savedItem,
      ConditionExpression: "attribute_not_exists(businessId) AND attribute_not_exists(id)",
    }));

    return {
      isBase64Encoded: false,
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Email subscription was saved successfully.",
        result: savedItem,
      }),
    };
  } catch (error: unknown) {
    const conflict = error instanceof Error && error.name === "ConditionalCheckFailedException";
    return {
      isBase64Encoded: false,
      statusCode: conflict ? 409 : 400,
      headers,
      body: JSON.stringify({
        success: false,
        message: conflict ? "Email subscription already exists." : getErrorMessage(error),
      }),
    };
  }
};

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${fieldName}.`);
  }
  return value.trim();
}

export const handler = withCreateValidation("/app/admin/emails", validatedHandler, "POST");
