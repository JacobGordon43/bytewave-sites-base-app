import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { getErrorMessage, type AuthenticatedApiEvent } from "./types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ALLOWED_ROLES = ["Bytewave-Admin", "Admin"];

type JsonRecord = Record<string, unknown>;

class TenantCrudError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

type HandlerOptions = {
  tableName: string;
  resourceName: string;
  prepareItem?: (item: JsonRecord) => JsonRecord;
};

function headers(methods: string) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": `OPTIONS,${methods}`,
  };
}

function response(statusCode: number, methods: string, body: JsonRecord) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers: headers(methods),
    body: JSON.stringify(body),
  };
}

function getAuthorizedBusinessId(event: AuthenticatedApiEvent): string {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims) throw new TenantCrudError(401, "Authentication is required.");

  const roles = getRolesFromClaims(claims);
  if (!roles.some((role) => ALLOWED_ROLES.includes(role))) {
    throw new TenantCrudError(403, "You do not have access to this data.");
  }

  const businessId = getBusinessIdFromClaims(claims);
  if (!businessId) {
    throw new TenantCrudError(403, "The authenticated user is missing a business ID.");
  }
  return businessId;
}

function errorStatus(error: unknown, fallback: number): number {
  return error instanceof TenantCrudError ? error.statusCode : fallback;
}

function parseBody(event: AuthenticatedApiEvent): JsonRecord {
  if (!event.body) throw new Error("Missing request body.");
  const body: unknown = JSON.parse(event.body);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object.");
  }
  return body as JsonRecord;
}

function requireRecord(value: unknown, fieldName: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${fieldName} must be a JSON object.`);
  }
  return value as JsonRecord;
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${fieldName}.`);
  }
  return value.trim();
}

function cleanRecord(record: JsonRecord): JsonRecord {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function getLimit(event: AuthenticatedApiEvent): number {
  const requested = Number(event.queryStringParameters?.limit ?? 100);
  if (!Number.isInteger(requested) || requested < 1) return 100;
  return Math.min(requested, 100);
}

function decodeNextToken(token: string | undefined): JsonRecord | undefined {
  if (!token) return undefined;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    return requireRecord(parsed, "nextToken");
  } catch {
    throw new Error("Invalid nextToken.");
  }
}

function encodeNextToken(key: JsonRecord | undefined): string | undefined {
  return key
    ? Buffer.from(JSON.stringify(key), "utf8").toString("base64url")
    : undefined;
}

export function createProtectedTenantItemHandler({
  tableName,
  resourceName,
  prepareItem,
}: HandlerOptions) {
  return async (event: AuthenticatedApiEvent) => {
    try {
      const businessId = getAuthorizedBusinessId(event);
      const body = parseBody(event);
      const requestedItem = cleanRecord(requireRecord(body.item, "item"));
      const item = cleanRecord(prepareItem ? prepareItem(requestedItem) : requestedItem);
      const id = requireString(item.id, "item.id");
      const savedItem = { ...item, id, businessId };

      await dynamo.send(new PutCommand({
        TableName: tableName,
        Item: savedItem,
        ConditionExpression: "attribute_not_exists(businessId) AND attribute_not_exists(id)",
      }));

      return response(200, "POST", {
        success: true,
        message: `${resourceName} was created successfully.`,
        result: savedItem,
      });
    } catch (error: unknown) {
      const conflict = error instanceof Error && error.name === "ConditionalCheckFailedException";
      return response(conflict ? 409 : errorStatus(error, 400), "POST", {
        success: false,
        message: conflict ? `${resourceName} already exists.` : getErrorMessage(error),
      });
    }
  };
}

export function createPublicTenantCollectionHandler({ tableName, resourceName }: HandlerOptions) {
  return async (event: AuthenticatedApiEvent) => {
    try {
      const businessId = requireString(event.pathParameters?.businessId, "businessId");
      const query = await dynamo.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "businessId = :businessId",
        ExpressionAttributeValues: { ":businessId": businessId },
        Limit: getLimit(event),
        ExclusiveStartKey: decodeNextToken(event.queryStringParameters?.nextToken),
      }));

      return response(200, "GET", {
        success: true,
        message: query.Items?.length
          ? `${resourceName} records were retrieved successfully.`
          : `No ${resourceName.toLowerCase()} records were found.`,
        results: query.Items ?? [],
        nextToken: encodeNextToken(query.LastEvaluatedKey),
      });
    } catch (error: unknown) {
      return response(400, "GET", {
        success: false,
        message: getErrorMessage(error),
        results: [],
      });
    }
  };
}

export function createProtectedTenantCollectionHandler({ tableName, resourceName }: HandlerOptions) {
  return async (event: AuthenticatedApiEvent) => {
    try {
      const businessId = getAuthorizedBusinessId(event);
      const query = await dynamo.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "businessId = :businessId",
        ExpressionAttributeValues: { ":businessId": businessId },
        Limit: getLimit(event),
        ExclusiveStartKey: decodeNextToken(event.queryStringParameters?.nextToken),
      }));

      return response(200, "GET", {
        success: true,
        message: query.Items?.length
          ? `${resourceName} records were retrieved successfully.`
          : `No ${resourceName.toLowerCase()} records were found.`,
        results: query.Items ?? [],
        nextToken: encodeNextToken(query.LastEvaluatedKey),
      });
    } catch (error: unknown) {
      return response(400, "GET", {
        success: false,
        message: getErrorMessage(error),
        results: [],
      });
    }
  };
}

export function createProtectedTenantUpdateHandler({ tableName, resourceName }: HandlerOptions) {
  return async (event: AuthenticatedApiEvent) => {
    try {
      const businessId = getAuthorizedBusinessId(event);
      const body = parseBody(event);
      const id = requireString(body.id, "id");
      const requestedUpdates = requireRecord(body.updates, "updates");
      const updates = cleanRecord({ ...requestedUpdates, lastUpdated: Date.now() });

      const expressionParts: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: JsonRecord = {};

      for (const [index, [key, value]] of Object.entries(updates).entries()) {
        if (key === "id" || key === "businessId") continue;
        if (typeof value === "string" && value === "[object Object]") {
          throw new Error(`Invalid value for ${key}.`);
        }

        const nameToken = `#field_${index}`;
        const valueToken = `:value_${index}`;
        expressionParts.push(`${nameToken} = ${valueToken}`);
        expressionAttributeNames[nameToken] = key;
        expressionAttributeValues[valueToken] = value;
      }

      if (!expressionParts.length) throw new Error("No valid update fields were provided.");

      const result = await dynamo.send(new UpdateCommand({
        TableName: tableName,
        Key: { businessId, id },
        UpdateExpression: `SET ${expressionParts.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "attribute_exists(businessId) AND attribute_exists(id)",
        ReturnValues: "ALL_NEW",
      }));

      return response(200, "PUT", {
        success: true,
        message: `${resourceName} was updated successfully.`,
        result: result.Attributes,
      });
    } catch (error: unknown) {
      const missing = error instanceof Error && error.name === "ConditionalCheckFailedException";
      return response(missing ? 404 : errorStatus(error, 400), "PUT", {
        success: false,
        message: missing ? `${resourceName} was not found.` : getErrorMessage(error),
      });
    }
  };
}

export function createProtectedTenantDeleteHandler({ tableName, resourceName }: HandlerOptions) {
  return async (event: AuthenticatedApiEvent) => {
    try {
      const businessId = getAuthorizedBusinessId(event);
      const id = requireString(event.pathParameters?.id, "id");
      const result = await dynamo.send(new DeleteCommand({
        TableName: tableName,
        Key: { businessId, id },
        ReturnValues: "ALL_OLD",
      }));

      if (!result.Attributes) {
        return response(404, "DELETE", {
          success: false,
          message: `${resourceName} was not found.`,
        });
      }

      return response(200, "DELETE", {
        success: true,
        message: `${resourceName} was deleted successfully.`,
        result: result.Attributes,
      });
    } catch (error: unknown) {
      return response(errorStatus(error, 400), "DELETE", {
        success: false,
        message: getErrorMessage(error),
      });
    }
  };
}
