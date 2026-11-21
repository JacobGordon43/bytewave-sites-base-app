import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, type QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import type { AuthenticatedApiEvent } from "./types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PRIVILEGED_ROLES = new Set(["Bytewave-Admin", "Support"]);
const CLIENT_ROLES = new Set(["Client"]);
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;
const SAFE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:@#-]{0,255}$/;

export type TenantIdentity = {
  businessId: string;
  subject?: string;
  roles: string[];
  privileged: boolean;
  client: boolean;
};

type TenantQueryConfig = {
  operation: string;
  tableName: string;
  indexName?: string;
  clientIndexName?: string;
  clientLookupAttribute?: string;
  pathParameter?: string;
  lookupAttribute?: string;
  clientMayQueryOwnLookup?: boolean;
  allowClient?: boolean;
};

export class ApiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

export function response(
  statusCode: number,
  body: Record<string, unknown>,
  allowedMethods = "OPTIONS,GET",
) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": allowedMethods,
    },
    body: JSON.stringify(body),
  };
}

export function getTenantIdentity(event: AuthenticatedApiEvent): TenantIdentity {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims) throw new ApiError(401, "Authentication is required.");

  const businessId = getBusinessIdFromClaims(claims);
  if (!businessId) throw new ApiError(403, "The authenticated user is missing a business ID.");

  const roles = getRolesFromClaims(claims);
  const privileged = roles.some((role) => PRIVILEGED_ROLES.has(role));
  const client = roles.some((role) => CLIENT_ROLES.has(role));
  if (!privileged && !client) throw new ApiError(403, "You do not have access to this data.");

  const subject = typeof claims.sub === "string" ? claims.sub : undefined;
  if (client && !privileged && !subject) {
    throw new ApiError(403, "The authenticated client is missing a user ID.");
  }

  return { businessId, subject, roles, privileged, client };
}

export function assertSafeIdentifier(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !SAFE_IDENTIFIER.test(value)) {
    throw new ApiError(400, `${fieldName} is missing or invalid.`);
  }
  return value;
}

export function createTenantQueryHandler(config: TenantQueryConfig) {
  return async (event: AuthenticatedApiEvent) => {
    try {
      const identity = getTenantIdentity(event);
      if (config.allowClient === false && !identity.privileged) {
        throw new ApiError(403, "You do not have access to this data.");
      }

      const expressionAttributeNames: Record<string, string> = {
        "#businessId": "businessId",
      };
      const expressionAttributeValues: Record<string, unknown> = {
        ":businessId": identity.businessId,
      };
      let keyConditionExpression = "#businessId = :businessId";
      let indexName = config.indexName;

      if (
        identity.client &&
        !identity.privileged &&
        config.clientIndexName &&
        config.clientLookupAttribute
      ) {
        expressionAttributeNames["#clientOwner"] = config.clientLookupAttribute;
        expressionAttributeValues[":clientOwner"] = identity.subject;
        keyConditionExpression += " AND #clientOwner = :clientOwner";
        indexName = config.clientIndexName;
      }

      if (config.pathParameter && config.lookupAttribute) {
        const lookupValue = assertSafeIdentifier(
          event.pathParameters?.[config.pathParameter],
          config.pathParameter,
        );

        if (config.clientMayQueryOwnLookup && identity.client && !identity.privileged) {
          if (!identity.subject || lookupValue !== identity.subject) {
            throw new ApiError(403, "Clients may only request their own records.");
          }
        }

        expressionAttributeNames["#lookup"] = config.lookupAttribute;
        expressionAttributeValues[":lookup"] = lookupValue;
        keyConditionExpression += " AND #lookup = :lookup";
      }

      const input: QueryCommandInput = {
        TableName: config.tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: parseLimit(event.queryStringParameters?.limit),
        ExclusiveStartKey: decodeCursor(event.queryStringParameters?.nextToken),
      };

      const result = await dynamo.send(new QueryCommand(input));
      const items = result.Items ?? [];

      return response(200, {
        success: true,
        message: items.length === 0
          ? "There were no records found in the database."
          : "Successfully retrieved data.",
        results: items,
        nextToken: encodeCursor(result.LastEvaluatedKey),
      });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return response(error.statusCode, {
          success: false,
          results: [],
          message: error.message,
        });
      }

      console.error(`${config.operation} failed`, error);
      return response(500, {
        success: false,
        results: [],
        message: "The records could not be retrieved.",
      });
    }
  };
}

export function parseLimit(rawLimit: string | undefined): number {
  if (rawLimit === undefined) return DEFAULT_PAGE_SIZE;
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new ApiError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}.`);
  }
  return limit;
}

export function encodeCursor(key: Record<string, unknown> | undefined): string | undefined {
  return key
    ? Buffer.from(JSON.stringify(key), "utf8").toString("base64url")
    : undefined;
}

export function decodeCursor(token: string | undefined): Record<string, unknown> | undefined {
  if (!token) return undefined;

  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "nextToken is invalid.");
  }
}
