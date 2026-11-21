import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export interface EmailMessage {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

const ses = new SESv2Client({ maxAttempts: 2 });

function required(value: string, field: string) {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`Missing required field: ${field}`);
  return value.trim();
}

function address(name: string, email: string) {
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email))
    throw new Error("Email addresses cannot contain line breaks.");
  return `"${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}" <${email}>`;
}

/** Shared transport only. Each caller owns authorization, templates and retry/deduplication policy. */
export async function sendEmail(message: EmailMessage) {
  const fromEmail = required(message.fromEmail, "fromEmail");
  const subject = required(message.subject, "subject");
  if (/[\r\n]/.test(subject)) throw new Error("Email subject cannot contain line breaks.");
  const result = await ses.send(
    new SendEmailCommand({
      FromEmailAddress: address(required(message.fromName, "fromName"), fromEmail),
      Destination: {
        ToAddresses: [
          address(required(message.toName, "toName"), required(message.toEmail, "toEmail")),
        ],
      },
      ReplyToAddresses: [fromEmail],
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: required(message.htmlBody, "htmlBody"), Charset: "UTF-8" },
            ...(message.textBody ? { Text: { Data: message.textBody, Charset: "UTF-8" } } : {}),
          },
        },
      },
    }),
  );
  return result.MessageId;
}

export function escapeEmailHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );
}
