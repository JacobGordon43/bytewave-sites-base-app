import { getTableName } from "../shared/environment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    const clientId = assertSafeIdentifier(event.pathParameters?.id, "id");

    if (identity.client && !identity.privileged) {
      if (!identity.subject || clientId !== identity.subject) {
        throw new ApiError(403, "Clients may only request their own client record.");
      }
    }

    const result = await dynamo.send(new GetCommand({
      TableName: getTableName("clients"),
      Key: {
        businessId: identity.businessId,
        id: clientId,
      },
    }));

    if (!result.Item) {
      throw new ApiError(404, "The client was not found.");
    }

    return response(200, {
      success: true,
      message: "Successfully retrieved client data.",
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

    console.error("GetClientById failed", error);
    return response(500, {
      success: false,
      results: [],
      message: "The client could not be retrieved.",
    });
  }
};
