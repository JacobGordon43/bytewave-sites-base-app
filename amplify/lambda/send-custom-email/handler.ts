import { withCreateValidation } from "../shared/validate-create";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { sendEmail } from "../shared/email";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "";
const PRIVILEGED_ROLES = new Set(["Bytewave-Admin", "Support", "Admin"]);
const ALLOWED_ROLES = new Set([...PRIVILEGED_ROLES, "Client"]);

interface SendEmailRequest {
  businessId: string;
  email: {
    toEmail: string;
    fromName: string;
    toName: string;
    fromEmail: string;
    htmlBody: string;
    subject: string;
  };
}

const validatedHandler = async (event: AuthenticatedApiEvent) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };

  let statusCode = 200;
  let body;

  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
      return {
        isBase64Encoded: false,
        statusCode: 401,
        body: JSON.stringify({
          message: "Authentication is required.",
          success: false,
        }),
        headers,
      };
    }

    const roles = getRolesFromClaims(claims);
    if (!roles.some((role) => ALLOWED_ROLES.has(role))) {
      return {
        isBase64Encoded: false,
        statusCode: 403,
        body: JSON.stringify({
          message: "You do not have permission to send custom emails.",
          success: false,
        }),
        headers,
      };
    }

    if (!event.body) throw new Error("Missing request body");

    const requestBody = JSON.parse(event.body);
    const emailRequest: SendEmailRequest = requestBody.email;
    const businessId =
      getOptionalString(emailRequest.businessId) ??
      event.pathParameters?.businessId ??
      event.pathParameters?.id;
    if (!businessId) throw new Error("Missing business ID");

    const clientOnly = roles.includes("Client") &&
      !roles.some((role) => PRIVILEGED_ROLES.has(role));
    if (clientOnly) {
      const businessIdFromClaims = getBusinessIdFromClaims(claims);
      const recipient = getOptionalString(emailRequest.email?.toEmail)?.toLowerCase();
      if (businessIdFromClaims !== businessId || recipient !== SUPPORT_EMAIL) {
        return {
          isBase64Encoded: false,
          statusCode: 403,
          body: JSON.stringify({
            message: "Clients may only send support notifications for their own business.",
            success: false,
          }),
          headers,
        };
      }

      emailRequest.email = {
        ...emailRequest.email,
        fromEmail: SUPPORT_EMAIL,
        fromName: `${process.env.BUSINESS_NAME || "Website"} Support`,
        toEmail: SUPPORT_EMAIL,
        toName: `${process.env.BUSINESS_NAME || "Website"} Support`,
      };
    }

    // The authenticated endpoint and automatic billing notices share SES transport.
    // Keep this endpoint's existing request/response shape for ticket replies.
    const messageId = await sendEmail(emailRequest.email);

    body = {
      message: "Email was sent successfully",
      results: {
        messageId,
      },
      success: true,
    };
  } catch (err) {
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

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export const handler = withCreateValidation("/app/admin/emails/send", validatedHandler, "POST");
