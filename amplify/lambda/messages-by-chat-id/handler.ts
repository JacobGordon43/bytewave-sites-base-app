import { getTableName } from "../shared/environment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { AuthenticatedApiEvent } from "../shared/types";
import {
  ApiError,
  assertSafeIdentifier,
  createTenantQueryHandler,
  getTenantIdentity,
  response,
} from "../shared/tenant-query";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const queryMessages = createTenantQueryHandler({
  operation: "GetMessagesByChatId",
  tableName: getTableName("messages"),
  indexName: "chatIDIndex",
  pathParameter: "chatId",
  lookupAttribute: "chatId",
});

export const handler = async (event: AuthenticatedApiEvent) => {
  try {
    const identity = getTenantIdentity(event);
    const chatId = assertSafeIdentifier(event.pathParameters?.chatId, "chatId");

    if (identity.client && !identity.privileged) {
      if (!identity.subject) throw new ApiError(403, "The authenticated user is missing a subject.");

      const ticket = await dynamo.send(new GetCommand({
        TableName: getTableName("tickets"),
        Key: { businessId: identity.businessId, id: chatId },
        ProjectionExpression: "createdById",
      }));

      if (!ticket.Item) throw new ApiError(404, "The ticket was not found.");
      if (ticket.Item.createdById !== identity.subject) {
        throw new ApiError(403, "Clients may only request messages from their own tickets.");
      }
    }

    return queryMessages(event);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return response(error.statusCode, {
        success: false,
        results: [],
        message: error.message,
      });
    }

    console.error("GetMessagesByChatId authorization failed", error);
    return response(500, {
      success: false,
      results: [],
      message: "The messages could not be retrieved.",
    });
  }
};
