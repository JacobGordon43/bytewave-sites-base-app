import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({})
const dynamodb = DynamoDBDocumentClient.from(client)
const ALLOWED_ROLES = [
  "Bytewave-Admin"
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

    const paymentsTableName = getTableName("payments");
    const metricsTableName = getTableName("business-metrics");
    const key = { businessId: businessIdFromClaims, id };

    const paymentResponse = await dynamodb.send(new GetCommand({
      TableName: paymentsTableName,
      Key: key,
      ConsistentRead: true,
    }));

    const payment = paymentResponse.Item;
    if (!payment) {
      statusCode = 404;
      body = { message: "The payment could not be found", success: false };
    } else {
      // Retain Stripe checkout/receipt records needed to reconcile later events.
      // The delete transaction repeats this guard so a concurrent checkout cannot lose its bill.
      if (payment.stripeCheckoutAttempt || payment.stripeInvoiceId) {
        throw new Error("This payment has an active or completed Stripe checkout and cannot be deleted.");
      }
      const storedAmountCents = payment.amountCents;
      const amountCents = Number.isSafeInteger(storedAmountCents)
        ? storedAmountCents
        : Math.round(Number(payment.amount) * 100);

      if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
        throw new Error("The payment amount is invalid and could not be removed from revenue.");
      }

      const deleteCondition = Number.isSafeInteger(storedAmountCents)
        ? "attribute_exists(#id) AND #amountCents = :amountCents"
        : "attribute_exists(#id) AND attribute_not_exists(#amountCents) AND #amount = :amount";

      const deleteExpressionAttributeNames: Record<string, string> = {
        "#id": "id",
        "#amountCents": "amountCents",
      };
      const deleteExpressionAttributeValues: Record<string, number> = {};

      if (Number.isSafeInteger(storedAmountCents)) {
        deleteExpressionAttributeValues[":amountCents"] = amountCents;
      } else {
        deleteExpressionAttributeNames["#amount"] = "amount";
        deleteExpressionAttributeValues[":amount"] = Number(payment.amount);
      }

      await dynamodb.send(new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: paymentsTableName,
              Key: key,
              ConditionExpression: `${deleteCondition} AND attribute_not_exists(stripeCheckoutAttempt) AND attribute_not_exists(stripeInvoiceId)`,
              ExpressionAttributeNames: deleteExpressionAttributeNames,
              ExpressionAttributeValues: deleteExpressionAttributeValues,
            },
          },
          {
            Update: {
              TableName: metricsTableName,
              Key: {
                businessId: businessIdFromClaims,
                id: "revenue",
              },
              UpdateExpression: "ADD #totalRevenueCents :amountDifference, #version :one",
              ConditionExpression:
                "attribute_exists(#totalRevenueCents) AND #totalRevenueCents >= :amountCents",
              ExpressionAttributeNames: {
                "#totalRevenueCents": "totalRevenueCents",
                "#version": "version",
              },
              ExpressionAttributeValues: {
                ":amountDifference": -amountCents,
                ":amountCents": amountCents,
                ":one": 1,
              },
            },
          },
        ],
      }));

      body = { message: "The payment was deleted successfully", success: true };
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
