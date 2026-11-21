import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  BatchWriteCommandInput
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const ALLOWED_ROLES = [
  "Bytewave-Admin",
  "Admin"
];

export const handler = async (event: AuthenticatedApiEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,DELETE",
  };

  const claims = event.requestContext?.authorizer?.jwt?.claims;
  const requestBody = JSON.parse(event.body!);

  let statusCode = 200;
  let body;
  let size = 25; // batch uploads can only handle 25 items/uploads at a time
  const tableName = getTableName("services")
  
  try{
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
    const {ids} = requestBody;
    //Formats the items into a request for the batch
    const deleteRequests = ids.map((id : string) => {
      return {
        DeleteRequest: {
          Key:{
            businessId: businessIdFromClaims,
            id
          } 
        }
      }
    });

    if(deleteRequests.length === 0) throw new Error("No items to delete");
    
    let requestChunks;
    if(deleteRequests.length > size){
      requestChunks = handleChunks(deleteRequests, size);
    }else{
      requestChunks = [];
      requestChunks.push(deleteRequests);
    }
    let i = 0;
    for(const chunk of requestChunks){
      i++
      let params : BatchWriteCommandInput = {
        RequestItems: {
          [tableName]: chunk
        }
      }
      let response;
      do{
        response = await dynamo.send(new BatchWriteCommand(params));
        if (
          response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0
        ) { 
          await new Promise(resolve => setTimeout(resolve, 50));
          params.RequestItems = response.UnprocessedItems;
        } else {
          break;
        }
        params.RequestItems = response.UnprocessedItems

      }while(response.UnprocessedItems && Object.keys(response.UnprocessedItems).length >0)
    }
    body = {
      "message": "All items were successfully deleted from the database",
      "success": true
    }
  }catch (err: unknown){
    statusCode = 400;
    body = {
      "message": getErrorMessage(err),
      "success": false
    }
  }finally{
    body = JSON.stringify(body);
  }

  return {
    "isBase64Encoded": false,
    statusCode,
    body,
    headers
  };
};

function handleChunks(items: any[], size: number): any[][]{
  let chunks = [];

  for(let i = 0; i < items.length; i += size){
    chunks.push(items.slice(i, i + size))
  }

  return chunks;
}
