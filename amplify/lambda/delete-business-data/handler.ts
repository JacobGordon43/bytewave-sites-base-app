import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, type DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({})
const dynamodb = DynamoDBDocumentClient.from(client)
const ALLOWED_ROLES = [
  "Bytewave-Admin",
  "Admin"
];

export const handler = async (event: AuthenticatedApiEvent) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,DELETE",
  };

  const claims = event.requestContext?.authorizer?.jwt?.claims;

  let statusCode = 200;
  let body;

  try {
        if (!claims) {
      return {
        isBase64Encoded: false,
        statusCode: 403,
        headers,
        body: JSON.stringify({
          success: false,
          results: [],
          message: "No claims data was found. Please contact your administrator."
        })
      };
    }

    const businessIdFromClaims = getBusinessIdFromClaims(claims);
    const roles = getRolesFromClaims(claims);

    if (!roles.some(role => ALLOWED_ROLES.includes(role as string))) {
      return {
        isBase64Encoded: false,
        statusCode: 403,
        headers,
        body: JSON.stringify({
          success: false,
          message: "You do not have access to this data."
        })
      };
    }

    if (!businessIdFromClaims) throw new Error("Missing business ID claim");

    const id = event.pathParameters?.id
    if (!id) throw new Error("Missing item id");

    const deleteParams: DeleteCommandInput = {
      TableName: getTableName("businesses"),
      Key: { businessId: businessIdFromClaims, id },
      ReturnValues: "ALL_OLD"
    };

    const response = await dynamodb.send(new DeleteCommand(deleteParams));

    if (response.Attributes) {
      body = { message: "The item was deleted successfully", success: true };
    } else {
      body = { message: "The item could not be found", success: false };
    }
  } catch (err: unknown) {
    statusCode = err instanceof Error && err.name === "ConditionalCheckFailedException" ? 403 : 400;
    body = { message: getErrorMessage(err), success: false };
  } finally {
    body = JSON.stringify(body);
  }

  return {
    isBase64Encoded: false,
    statusCode,
    body,
    headers
  };
};
