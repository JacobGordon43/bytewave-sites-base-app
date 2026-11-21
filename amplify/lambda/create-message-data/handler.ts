import { withCreateValidation } from "../shared/validate-create";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { getTableName } from "../shared/environment";
import {
  ApiError,
  assertSafeIdentifier,
  response,
} from "../shared/tenant-query";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ALLOWED_ROLES = new Set(["Bytewave-Admin", "Support", "Client"]);
const PRIVILEGED_ROLES = new Set(["Bytewave-Admin", "Support"]);
const MAX_MESSAGE_LENGTH = 10_000;

const validatedHandler = async (event: AuthenticatedApiEvent) => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) throw new ApiError(401, "Authentication is required.");

    const businessId = getBusinessIdFromClaims(claims);
    if (!businessId) throw new ApiError(403, "Missing business ID claim.");

    const roles = getRolesFromClaims(claims);
    if (!roles.some((role) => ALLOWED_ROLES.has(role))) {
      throw new ApiError(403, "You do not have access to this data.");
    }

    if (!event.body) throw new ApiError(400, "Missing request body.");
    let responseBody: Record<string, unknown>;
    try {
      responseBody = JSON.parse(event.body) as Record<string, unknown>;
    } catch {
      throw new ApiError(400, "The request body must be valid JSON.");
    }
    const rawItem = responseBody.item;
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
      throw new ApiError(400, "A message is required.");
    }
    const item = rawItem as Record<string, unknown>;

    const messageId = assertSafeIdentifier(item.id, "message ID");
    const ticketId = assertSafeIdentifier(item.chatId, "ticket ID");
    if (typeof item.message !== "string" || !item.message.trim()) {
      throw new ApiError(400, "A message body is required.");
    }
    const messageBody = item.message.trim();
    if (messageBody.length > MAX_MESSAGE_LENGTH) {
      throw new ApiError(400, `The message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`);
    }

    const ticketsTable = getTableName("tickets");
    const messagesTable = getTableName("messages");
    const ticketResult = await dynamo.send(new GetCommand({
      TableName: ticketsTable,
      Key: { businessId, id: ticketId },
      ProjectionExpression: "createdById, #status",
      ExpressionAttributeNames: { "#status": "status" },
    }));
    const ticket = ticketResult.Item;
    if (!ticket) throw new ApiError(404, "The ticket was not found.");

    const createdById = assertSafeIdentifier(ticket.createdById, "ticket owner ID");
    const privileged = roles.some((role) => PRIVILEGED_ROLES.has(role));
    const subject = typeof claims.sub === "string" ? claims.sub : undefined;
    if (!privileged && (!subject || createdById !== subject)) {
      throw new ApiError(403, "Clients may only add messages to their own tickets.");
    }
    if (ticket.status !== "In Progress") {
      throw new ApiError(409, "Messages cannot be added to a resolved ticket.");
    }

    const timestamp = Date.now();
    const message = {
      businessId,
      id: messageId,
      chatId: ticketId,
      from: privileged ? "support" : "client",
      message: messageBody,
      date: timestamp,
    };

    await dynamo.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: messagesTable,
            Item: message,
            ConditionExpression: "attribute_not_exists(#businessId) AND attribute_not_exists(#id)",
            ExpressionAttributeNames: {
              "#businessId": "businessId",
              "#id": "id",
            },
          },
        },
        {
          ConditionCheck: {
            TableName: ticketsTable,
            Key: { businessId, id: ticketId },
            ConditionExpression: "#createdById = :createdById AND #status = :inProgress",
            ExpressionAttributeNames: {
              "#createdById": "createdById",
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":createdById": createdById,
              ":inProgress": "In Progress",
            },
          },
        },
        {
          Update: {
            TableName: ticketsTable,
            Key: { businessId, id: `ticketId_${ticketId}_metadata` },
            UpdateExpression: "SET #lastUpdated = :lastUpdated",
            ExpressionAttributeNames: { "#lastUpdated": "lastUpdated" },
            ExpressionAttributeValues: { ":lastUpdated": timestamp },
          },
        },
        {
          Update: {
            TableName: ticketsTable,
            Key: { businessId, id: `clientId_${createdById}_metadata` },
            UpdateExpression: "SET #lastUpdated = :lastUpdated",
            ExpressionAttributeNames: { "#lastUpdated": "lastUpdated" },
            ExpressionAttributeValues: { ":lastUpdated": timestamp },
          },
        },
      ],
    }));

    return response(200, {
      message: "The message was added successfully.",
      success: true,
      result: message,
      results: [message],
    }, "OPTIONS,POST");
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return response(error.statusCode, {
        success: false,
        results: [],
        message: error.message,
      }, "OPTIONS,POST");
    }

    const transactionConflict = error instanceof Error &&
      (error.name === "TransactionCanceledException" ||
        error.name === "TransactionConflictException");
    if (transactionConflict) {
      return response(409, {
        success: false,
        results: [],
        message: "The message could not be created because the ticket changed or the message already exists.",
      }, "OPTIONS,POST");
    }

    console.error("CreateMessageData failed", error);
    return response(500, {
      success: false,
      results: [],
      message: getErrorMessage(error) || "The message could not be created.",
    }, "OPTIONS,POST");
  }
};

export const handler = withCreateValidation("/app/messages", validatedHandler, "POST");
