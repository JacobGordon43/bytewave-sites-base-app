import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export const handler = async (event: AuthenticatedApiEvent) => {
    const headers = {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,GET",
    };
    const claims = event.requestContext?.authorizer?.jwt?.claims;
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
    const businessId = getBusinessIdFromClaims(claims);
    const roles = getRolesFromClaims(claims);
    const allowedRoles = [
        "Bytewave-Admin",
        "Support",
        "Admin"
    ]
    const tableName = getTableName("businesses")
    let message;
    let statusCode = 200
    let results : QueryCommandOutput;
    let body;

    try {
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
        const command = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "businessId = :businessId",
            ExpressionAttributeValues: {
                ":businessId": businessId
            }
        })
        results = await dynamo.send(command)
        if(results.Count == 0){
            message = "There were no records found in the database"
        }else{
            message = "Successfully retrieved data"
        }
        body = {message, "results": results.Items || [], success: true}
    } catch (err: unknown) {
        statusCode = 400;
        message = getErrorMessage(err) || "Unknown Error Occurred.";
        body = {
            message,
            "results": null,
            success: false
        }
    } finally {
        body = JSON.stringify(body);
    }

    return {
        "isBase64Encoded": false,
        statusCode,
        body,
        headers,
    };
};
