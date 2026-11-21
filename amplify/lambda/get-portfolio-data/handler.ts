import { getTableName } from "../shared/environment";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  ApiError,
  assertSafeIdentifier,
  decodeCursor,
  encodeCursor,
  parseLimit,
  response,
} from "../shared/tenant-query";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const businessId = assertSafeIdentifier(
      event.pathParameters?.businessId,
      "businessId",
    );

    const result = await dynamo.send(new QueryCommand({
      TableName: getTableName("portfolio"),
      KeyConditionExpression: "#businessId = :businessId",
      ExpressionAttributeNames: { "#businessId": "businessId" },
      ExpressionAttributeValues: { ":businessId": businessId },
      Limit: parseLimit(event.queryStringParameters?.limit),
      ExclusiveStartKey: decodeCursor(event.queryStringParameters?.nextToken),
    }));
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

    console.error("GetPortfolioData failed", error);
    return response(500, {
      success: false,
      results: [],
      message: "The portfolio could not be retrieved.",
    });
  }
};
