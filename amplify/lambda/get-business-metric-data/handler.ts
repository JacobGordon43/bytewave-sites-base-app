import { getTableName } from "../shared/environment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ALLOWED_ROLES = new Set(["Bytewave-Admin"]);

export const handler = async (event: AuthenticatedApiEvent) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,GET",
  };

  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return response(401, headers, {
        success: false,
        results: [],
        message: "Authentication is required.",
      });
    }
    const id = event.pathParameters?.id

    const roles = getRolesFromClaims(claims);
    if (!roles.some((role) => ALLOWED_ROLES.has(role))) {
      return response(403, headers, {
        success: false,
        results: [],
        message: "You do not have access to this data.",
      });
    }

    const businessId = getBusinessIdFromClaims(claims);
    if (!businessId) {
      return response(403, headers, {
        success: false,
        results: [],
        message: "The authenticated user is missing a business ID.",
      });
    }

    if (!id) {
      return response(400, headers, {
        success: false,
        results: [],
        message: "A metric ID is required.",
      });
    }

    const result = await dynamo.send(new GetCommand({
      TableName: getTableName("business-metrics"),
      Key: {
        businessId,
        id
      },
    }));

    return response(200, headers, {
      success: true,
      results: result.Item ? [result.Item] : [],
      message: result.Item
        ? "Successfully retrieved business metrics."
        : "There were no business metrics found in the database.",
    });
  } catch (error: unknown) {
    console.error("Failed to retrieve business metrics.", error);
    return response(500, headers, {
      success: false,
      results: [],
      message: getErrorMessage(error),
    });
  }
};

function response(
  statusCode: number,
  headers: Record<string, string>,
  body: Record<string, unknown>,
) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}
