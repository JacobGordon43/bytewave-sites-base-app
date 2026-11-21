import { withCreateValidation } from "../shared/validate-create";
import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

const validatedHandler = async (event: AuthenticatedApiEvent) => {
    const headers = {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
    };

    const claims = event.requestContext?.authorizer?.jwt?.claims;
    let statusCode = 200
    let body

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
        const allowedRoles = [
            "Bytewave-Admin",
            "Support"
        ];
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

        if (!event.body) throw new Error("Missing request body")
        const responseBody = JSON.parse(event.body);
        const {item} = responseBody;
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Request body must be a JSON object")
        }
        if (!businessIdFromClaims) throw new Error("Missing business ID claim")
        item.businessId = businessIdFromClaims

        const sanitizedItem = HandleValues(item)
        const command = new PutCommand({
            TableName: getTableName("projects"),
            Item: sanitizedItem,
            ConditionExpression: "attribute_not_exists(businessId) AND attribute_not_exists(id)",
        })
        await dynamo.send(command)

        body = { message: "The item was added successfully", success: true }
    } catch (err: unknown) {
        statusCode = 400
        body = { message: getErrorMessage(err), success: false }
    } finally {
        body = JSON.stringify(body)
    }

    return {
        "isBase64Encoded": false,
        statusCode,
        body,
        headers
    }
}

function HandleValues(obj: Record<string, any>): Record<string, any>{
    return Object.fromEntries(
        Object.entries(obj).filter(([, value])=>value !== null && value !== undefined)
    );
}

export const handler = withCreateValidation("/app/admin/projects", validatedHandler, "POST");
