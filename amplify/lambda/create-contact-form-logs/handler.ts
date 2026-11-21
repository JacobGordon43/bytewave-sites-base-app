import { withCreateValidation } from "../shared/validate-create";
import { getTableName } from "../shared/environment";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const ses = new SESv2Client({});

const validatedHandler = async (event: AuthenticatedApiEvent) => {
    const headers = {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
    };

    let statusCode = 200
    let body

    try {
        if (!event.body) throw new Error("Missing request body")
        
        const responseBody = JSON.parse(event.body);
        const { item } = responseBody;

        if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Request body must be a JSON object")
        }

        const businessId = getRequiredString(responseBody.businessId, "businessId");
        const turnstileToken = getOptionalString(responseBody.turnstileToken) ?? getOptionalString(item.turnstileToken);

        if (!turnstileToken) {
          throw new Error("Missing required field: turnstileToken");
        }

        await verifyTurnstile(turnstileToken, event.requestContext?.http?.sourceIp);

        const { turnstileToken: _turnstileToken, ...contactItem } = item;
        contactItem.businessId = businessId;

        const sanitizedItem = HandleValues(contactItem)
        const command = new PutCommand({
          TableName: getTableName("contact-form-logs"),
          Item: sanitizedItem,
          ConditionExpression: "attribute_not_exists(businessId) AND attribute_not_exists(id)",
        })
        await dynamo.send(command)

        const emailResponse = await sendContactEmail(businessId, sanitizedItem);

        body = {
          message: emailResponse.success
            ? "The submission was saved and emailed successfully."
            : "The submission was saved, but the email was not sent.",
          success: true,
          emailResponse,
        }
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

//Captcha validation
async function verifyTurnstile(token: string, remoteIp?:string){
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if(!secret) throw new Error("Missing Turnstile secret key in environment");
  const body = new URLSearchParams({
    secret,
    response: token
  })

  if(remoteIp){
    body.set("remoteip", remoteIp)
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const result = await response.json() as { success: boolean; "error-codes"?: string[] }

  if(!response.ok || !result.success){
    throw new Error("Captcha verification failed");
  }
}

function getRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${fieldName}`);
  }

  return value.trim();
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

type ContactSubmissionEmail = Record<string, unknown> & {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  subject?: unknown;
  message?: unknown;
  description?: unknown;
  projectType?: unknown;
  budget?: unknown;
  timeline?: unknown;
  type?: unknown;
};

type BusinessInfoEmail = {
  address?: unknown;
  isContactForm?: unknown;
};

function getContactRecipient(businessInfo: Record<string, unknown>): string {
  const legacyEmail = getOptionalString(businessInfo.email);
  if (legacyEmail) return legacyEmail;

  if (!Array.isArray(businessInfo.emails)) {
    throw new Error("Could not send email - no contact recipient is configured.");
  }

  const emails = businessInfo.emails.filter(
    (entry): entry is BusinessInfoEmail => Boolean(entry) && typeof entry === "object",
  );
  const contactEmail = emails.find((entry) => entry.isContactForm === true) ?? emails[0];
  const recipient = getOptionalString(contactEmail?.address);

  if (!recipient) {
    throw new Error("Could not send email - no contact recipient is configured.");
  }

  return recipient;
}

function getSubmissionMessage(submission: ContactSubmissionEmail): string {
  const message = getOptionalString(submission.message);
  if (message) return message;

  const description = getOptionalString(submission.description);
  if (!description) throw new Error("Missing required field: message or description");

  return [
    description,
    getOptionalString(submission.projectType)
      ? `Project type: ${getOptionalString(submission.projectType)}`
      : undefined,
    getOptionalString(submission.budget)
      ? `Budget: ${getOptionalString(submission.budget)}`
      : undefined,
    getOptionalString(submission.timeline)
      ? `Timeline: ${getOptionalString(submission.timeline)}`
      : undefined,
  ].filter((value): value is string => Boolean(value)).join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendContactEmail(
  businessId: string,
  submission: ContactSubmissionEmail,
): Promise<{ success: true; messageId?: string } | { success: false; error: string }> {
  try {
    const businessInfo = await dynamo.send(new QueryCommand({
      TableName: getTableName("business-info"),
      KeyConditionExpression: "businessId = :businessId",
      ExpressionAttributeValues: { ":businessId": businessId },
      Limit: 1,
    }));

    const businessInfoItem = businessInfo.Items?.[0];
    if (!businessInfoItem) {
      throw new Error("Could not send email - business information was not found.");
    }

    const name = getRequiredString(submission.name, "name");
    const replyToEmail = getRequiredString(submission.email, "email");
    const phone = getOptionalString(submission.phone) || "Not provided";
    const company = getOptionalString(submission.company) || "Not provided";
    const isConsultation = submission.type === "consultation";
    const subject = getOptionalString(submission.subject)
      || (isConsultation ? "New consultation request" : "Website contact form submission");
    const message = getSubmissionMessage(submission);
    const recipient = getContactRecipient(businessInfoItem);
    const fromEmail = businessInfoItem.emails.find((email: {
      label: string;
      address: string;
      isContactForm: boolean;
    }) => email.isContactForm);
    
    if (!fromEmail) throw new Error("CONTACT_FROM_EMAIL is not configured.");

    const emailSubject = `New website message: ${subject}`;
    const textBody = [
      isConsultation ? "New website consultation request" : "New website contact form submission",
      "",
      `Name: ${name}`,
      `Email: ${replyToEmail}`,
      `Phone: ${phone}`,
      `Company: ${company}`,
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const htmlBody = `
      <h2>${isConsultation ? "New website consultation request" : "New website contact form submission"}</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(replyToEmail)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `;

    const emailResult = await ses.send(new SendEmailCommand({
      FromEmailAddress: fromEmail.address,
      Destination: { ToAddresses: [recipient] },
      ReplyToAddresses: [replyToEmail],
      Content: {
        Simple: {
          Subject: { Data: emailSubject, Charset: "UTF-8" },
          Body: {
            Text: { Data: textBody, Charset: "UTF-8" },
            Html: { Data: htmlBody, Charset: "UTF-8" },
          },
        },
      },
    }));

    return { success: true, messageId: emailResult.MessageId };
  } catch (error: unknown) {
    console.error("Contact submission was saved, but email delivery failed.", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export const handler = withCreateValidation("/public/contact-form-logs", validatedHandler, "POST");
