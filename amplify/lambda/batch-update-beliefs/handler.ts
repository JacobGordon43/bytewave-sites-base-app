import { withCreateValidation } from "../shared/validate-create";
import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const validatedHandler = async (event: AuthenticatedApiEvent) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,PUT",
  };

  const claims = event.requestContext?.authorizer?.jwt?.claims;
  const allowedRoles = [
    "Bytewave-Admin",
    "Admin"
  ];
  const tableName = getTableName("beliefs");

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
    if(!roles.some(role=>allowedRoles.includes((role as string)))){
      return {
        "isBase64Encoded": false,
        statusCode: 403,
        headers,
        body: JSON.stringify({
          success: false,
          results: [],
          message: "You do not have access to this data."
        })
      }
    }

    const requestBody = JSON.parse(event.body!);
    const { itemsToSave = [], idsToDelete = [] } = requestBody;
    const transactItems = [];

    //PUTS (new or updated sections)
    for (let item of itemsToSave) {
      if (businessIdFromClaims) item.businessId = businessIdFromClaims;

      transactItems.push({
        Put: {
          TableName: tableName,
          Item: item,
          ConditionExpression:
            "attribute_not_exists(id) OR businessId = :businessId",
          ExpressionAttributeValues: {
            ":businessId": businessIdFromClaims,
          },
        },
      });
    }

    //DELETES (removed sections)
    for (const id of idsToDelete) {
      transactItems.push({
        Delete: {
          TableName: tableName,
          Key: {
            businessId: businessIdFromClaims, 
            id
          },
          ConditionExpression: "attribute_exists(id)",
        },
      });
    }

    // DynamoDB limit: max 25 items per transaction
    if (transactItems.length > 25) {
      throw new Error("Transaction exceeds 25 item limit.");
    }

    await dynamo.send(
        new TransactWriteCommand({
            TransactItems: transactItems,
        })
    );

    body = {
      message: "Transaction successful. All writes and deletes committed.",
      success: true,
    };
  } catch (err: unknown) {
    statusCode = 400;

    body = {
      message: getErrorMessage(err),
      success: false,
    };
  }

  return {
    isBase64Encoded: false,
    statusCode,
    body: JSON.stringify(body),
    headers,
  };
};

export const handler = withCreateValidation("/app/admin/beliefs/batch", validatedHandler, "PUT");
