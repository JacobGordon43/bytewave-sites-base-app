import { getTableName } from "../shared/environment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, type QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import {
  ApiError,
  decodeCursor,
  encodeCursor,
  getTenantIdentity,
  parseLimit,
  response,
} from "../shared/tenant-query";
import type { AuthenticatedApiEvent } from "../shared/types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = getTableName("tickets");
const INDEX_NAME = "businessIDDateCreatedIndex";

export const handler = async (event: AuthenticatedApiEvent) => {
  try {
    const identity = getTenantIdentity(event);
    const lastFetched = parseTimestamp(event.pathParameters?.lastFetched);

    const expressionAttributeNames: Record<string, string> = {
      "#businessId": "businessId",
      "#dateCreated": "dateCreated",
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ":businessId": identity.businessId,
      ":lastFetched": lastFetched,
    };

    const input: QueryCommandInput = {
      TableName: TABLE_NAME,
      IndexName: INDEX_NAME,
      KeyConditionExpression:
        "#businessId = :businessId AND #dateCreated > :lastFetched",
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: parseLimit(event.queryStringParameters?.limit),
      ExclusiveStartKey: decodeCursor(event.queryStringParameters?.nextToken),
      ScanIndexForward: false,
    };

    if (identity.client && !identity.privileged) {
      if (!identity.subject) {
        throw new ApiError(403, "The authenticated client is missing a user ID.");
      }
      expressionAttributeNames["#createdById"] = "createdById";
      expressionAttributeValues[":createdById"] = identity.subject;
      input.FilterExpression = "#createdById = :createdById";
    }

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

    console.error("GetTicketsAfterDate failed", error);
    return response(500, {
      success: false,
      results: [],
      message: "The tickets could not be retrieved.",
    });
  }
};

function parseTimestamp(rawTimestamp: string | undefined): number {
  if (rawTimestamp === undefined || !/^\d+$/.test(rawTimestamp)) {
    throw new ApiError(400, "lastFetched must be a non-negative integer timestamp.");
  }

  const timestamp = Number(rawTimestamp);
  if (!Number.isSafeInteger(timestamp)) {
    throw new ApiError(400, "lastFetched must be a non-negative integer timestamp.");
  }

  return timestamp;
}
