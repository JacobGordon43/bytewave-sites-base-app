import { getTableName } from "../shared/environment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, type QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const ses = new SESv2Client({});

type SendEmailRequest = {
  businessId?: unknown;
  submission?: ContactSubmissionEmail;
  item?: ContactSubmissionEmail;
} & Partial<ContactSubmissionEmail>;

type ContactSubmissionEmail = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
};

export const handler = async (event: AuthenticatedApiEvent) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };

  let statusCode = 200;
  let body;
  let results: QueryCommandOutput;

  try {
    if (!event.body) throw new Error("Missing request body");

    const requestBody = JSON.parse(event.body) as SendEmailRequest;
    const businessId = getOptionalString(requestBody.businessId) ?? event.pathParameters?.businessId ?? event.pathParameters?.id;
    if (!businessId) throw new Error("Missing business ID");

    const submission = requestBody.submission ?? requestBody.item ?? requestBody;

    results = await dynamo.send(new QueryCommand({
      TableName: getTableName("business-info"),
      KeyConditionExpression: "businessId = :businessId",
      ExpressionAttributeValues: {
        ":businessId": businessId,
      },
    }));

    const name = getRequiredString(submission.name, "name");
    const email = getRequiredString(submission.email, "email");
    const message = getRequiredString(submission.message, "message");
    const subject = getOptionalString(submission.subject) || "Website contact form submission";
    const phone = getOptionalString(submission.phone) || "Not provided";

    const fromEmail = "jacobpg43@gmail.com";
    const toEmail = getOptionalString(results.Items?.[0]?.email);

    if (!toEmail) throw new Error("Could not send email - missing recipient email");

    const emailSubject = `New website message: ${subject}`;
    const textBody = [
      "New website contact form submission",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const htmlBody = `
      <h2>New website contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `;

    const response = await ses.send(new SendEmailCommand({
      FromEmailAddress: fromEmail,
      Destination: {
        ToAddresses: [toEmail],
      },
      ReplyToAddresses: [email],
      Content: {
        Simple: {
          Subject: {
            Data: emailSubject,
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: textBody,
              Charset: "UTF-8",
            },
            Html: {
              Data: htmlBody,
              Charset: "UTF-8",
            },
          },
        },
      },
    }));

    body = {
      message: "Email was sent successfully",
      results: {
        messageId: response.MessageId,
      },
      success: true,
    };
  } catch (err: unknown) {
    statusCode = 400;
    body = {
      message: getErrorMessage(err),
      success: false,
    };
  } finally {
    body = JSON.stringify(body);
  }

  return {
    isBase64Encoded: false,
    statusCode,
    body,
    headers,
  };
};

function getRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${fieldName}`);
  }

  return value.trim();
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}