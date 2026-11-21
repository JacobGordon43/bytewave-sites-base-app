import { getTableName } from "../shared/environment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { AuthenticatedApiEvent } from "../shared/types";
import {
  ApiError,
  assertSafeIdentifier,
  getTenantIdentity,
  response,
} from "../shared/tenant-query";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: AuthenticatedApiEvent) => {
  try {
    const identity = getTenantIdentity(event);
    const metadataId = assertSafeIdentifier(event.pathParameters?.id, "id");

    if (identity.client && !identity.privileged) {
      await authorizeClientMetadata(identity.businessId, identity.subject, metadataId);
    }

    const result = await dynamo.send(new GetCommand({
      TableName: getTableName("tickets"),
      Key: { businessId: identity.businessId, id: metadataId },
    }));

    if (!result.Item) {
      throw new ApiError(404, "The ticket metadata was not found.");
    }

    return response(200, {
      success: true,
      message: "Successfully retrieved ticket metadata.",
      result: result.Item,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return response(error.statusCode, {
        success: false,
        result: null,
        message: error.message,
      });
    }

    console.error("GetMetadata failed", error);
    return response(500, {
      success: false,
      result: null,
      message: "The ticket metadata could not be retrieved.",
    });
  }
};

async function authorizeClientMetadata(
  businessId: string,
  subject: string | undefined,
  metadataId: string,
) {
  if (!subject) throw new ApiError(403, "The authenticated user is missing a subject.");

  if (metadataId === `clientId_${subject}_metadata`) return;

  const ticketMatch = /^ticketId_(.+)_metadata$/.exec(metadataId);
  if (!ticketMatch) {
    throw new ApiError(403, "Clients may only request metadata for their own tickets.");
  }

  const ticketId = assertSafeIdentifier(ticketMatch[1], "ticketId");
  const ticket = await dynamo.send(new GetCommand({
    TableName: getTableName("tickets"),
    Key: { businessId, id: ticketId },
    ProjectionExpression: "createdById",
  }));

  if (!ticket.Item) throw new ApiError(404, "The ticket was not found.");
  if (ticket.Item.createdById !== subject) {
    throw new ApiError(403, "Clients may only request metadata for their own tickets.");
  }
}
