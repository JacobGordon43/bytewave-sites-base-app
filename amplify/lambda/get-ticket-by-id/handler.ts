import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../shared/environment";
import {
  ApiError,
  assertSafeIdentifier,
  getTenantIdentity,
  response,
} from "../shared/tenant-query";
import type { AuthenticatedApiEvent } from "../shared/types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: AuthenticatedApiEvent) => {
  try {
    const identity = getTenantIdentity(event);
    const ticketId = assertSafeIdentifier(event.pathParameters?.id, "id");

    const result = await dynamo.send(new GetCommand({
      TableName: getTableName("tickets"),
      Key: {
        businessId: identity.businessId,
        id: ticketId,
      },
    }));

    if (!result.Item) {
      throw new ApiError(404, "The ticket was not found.");
    }

    if (identity.client && !identity.privileged) {
      if (!identity.subject || result.Item.createdById !== identity.subject) {
        throw new ApiError(403, "Clients may only request their own tickets.");
      }
    }

    return response(200, {
      success: true,
      message: "Successfully retrieved ticket data.",
      results: [result.Item],
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return response(error.statusCode, {
        success: false,
        results: [],
        message: error.message,
      });
    }

    console.error("GetTicketById failed", error);
    return response(500, {
      success: false,
      results: [],
      message: "The ticket could not be retrieved.",
    });
  }
};
