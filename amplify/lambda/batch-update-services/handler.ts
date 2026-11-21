import { withCreateValidation } from "../shared/validate-create";
import { getTableName } from "../shared/environment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = getTableName("services");
const MAX_TRANSACTION_ITEMS = 100;
const ALLOWED_ROLES = new Set([
  "Bytewave-Admin",
  "Admin",
]);

type JsonRecord = Record<string, unknown>;

const validatedHandler = async (event: AuthenticatedApiEvent) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,PUT",
  };

  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return errorResponse(401, headers, "Authentication is required.");
    }

    const roles = getRolesFromClaims(claims);
    if (!roles.some((role) => ALLOWED_ROLES.has(role))) {
      return errorResponse(403, headers, "You do not have access to this data.");
    }

    const businessId = getBusinessIdFromClaims(claims);
    if (!businessId) {
      return errorResponse(403, headers, "The authenticated user is missing a business ID.");
    }

    const requestBody = parseBody(event.body);
    const itemsToSave = requireArray(requestBody.itemsToSave, "itemsToSave");
    const idsToDelete = requireArray(requestBody.idsToDelete, "idsToDelete");
    const transactionCount = itemsToSave.length + idsToDelete.length;

    if (transactionCount > MAX_TRANSACTION_ITEMS) {
      throw new Error(
        `A services batch may contain at most ${MAX_TRANSACTION_ITEMS} operations.`,
      );
    }

    const savedIds = new Set<string>();
    const deletedIds = new Set<string>();
    const transactItems: NonNullable<TransactWriteCommandInput["TransactItems"]> = [];

    for (const value of itemsToSave) {
      const item = requireRecord(value, "Each item in itemsToSave");
      const id = requireId(item.id, "Each service being saved");

      if (savedIds.has(id)) {
        throw new Error(`Service ${id} appears more than once in itemsToSave.`);
      }
      savedIds.add(id);

      transactItems.push({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            ...cleanRecord(item),
            businessId,
            id,
          },
        },
      });
    }

    for (const value of idsToDelete) {
      const id = requireId(value, "Each service being deleted");

      if (deletedIds.has(id)) {
        throw new Error(`Service ${id} appears more than once in idsToDelete.`);
      }
      if (savedIds.has(id)) {
        throw new Error(`Service ${id} cannot be saved and deleted in the same batch.`);
      }
      deletedIds.add(id);

      transactItems.push({
        Delete: {
          TableName: TABLE_NAME,
          Key: { businessId, id },
        },
      });
    }

    if (transactItems.length > 0) {
      await dynamo.send(new TransactWriteCommand({ TransactItems: transactItems }));
    }

    return {
      isBase64Encoded: false,
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Services were saved successfully.",
        savedCount: itemsToSave.length,
        deletedCount: idsToDelete.length,
      }),
    };
  } catch (error: unknown) {
    return errorResponse(400, headers, getErrorMessage(error));
  }
};

function parseBody(body: string | null | undefined): JsonRecord {
  if (!body) throw new Error("Missing request body.");
  const parsed: unknown = JSON.parse(body);
  return requireRecord(parsed, "Request body");
}

function requireRecord(value: unknown, fieldName: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${fieldName} must be a JSON object.`);
  }
  return value as JsonRecord;
}

function requireArray(value: unknown, fieldName: string): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${fieldName} must be an array.`);
  return value;
}

function requireId(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must have a valid ID.`);
  }
  return value.trim();
}

function cleanRecord(record: JsonRecord): JsonRecord {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function errorResponse(
  statusCode: number,
  headers: Record<string, string>,
  message: string,
) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers,
    body: JSON.stringify({ success: false, message }),
  };
}

export const handler = withCreateValidation("/app/admin/services/batch", validatedHandler, "PUT");
