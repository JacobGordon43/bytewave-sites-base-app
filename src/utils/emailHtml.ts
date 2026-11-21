import { siteConfig } from "../config/site";
export interface TicketResponseEmailOptions {
  clientName?: string;
  ticketId?: string;
}

export interface TicketCreatedEmailOptions {
  ticketId: string;
  category?: string;
  description?: string;
}

export interface ClientTicketResponseEmailOptions {
  ticketId: string;
  message?: string;
}

export function createTicketResponseEmailHtml({
  clientName,
  ticketId,
}: TicketResponseEmailOptions = {}): string {
  const greeting = clientName
    ? `Hello ${escapeHtml(clientName)},`
    : "Hello,";
  const ticketReference = ticketId
    ? `<p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 24px;">
        Ticket: <strong style="color: #ffffff;">${escapeHtml(ticketId)}</strong>
      </p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Support responded to your ticket</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f172a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px;">
            <tr>
              <td style="padding: 40px;">
                <!--
                <img
                  src="${siteConfig.origin}/logo.svg"
                  alt="${siteConfig.name}"
                  width="160"
                  style="display: block; width: 160px; max-width: 100%; height: auto; margin: 0 0 24px; border: 0;"
                />
                -->

                <h1 style="margin: 0 0 20px; color: #ffffff; font-size: 26px; line-height: 34px;">
                  Support responded to your ticket
                </h1>

                <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 24px;">
                  ${greeting}
                </p>

                <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 24px;">
                  A member of our support team has responded to your support ticket.
                </p>

                ${ticketReference}

                <p style="margin: 0 0 28px; color: #cbd5e1; font-size: 15px; line-height: 24px;">
                  Sign in to your account to review the response and continue the conversation.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td bgcolor="#2563eb" style="border-radius: 8px;">
                      <a
                        href="${siteConfig.origin}/login"
                        target="_blank"
                        style="display: inline-block; padding: 13px 24px; color: #ffffff; font-size: 15px; font-weight: 700; line-height: 20px; text-decoration: none; border-radius: 8px;"
                      >
                        View Support Response
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 32px 0 0; color: #94a3b8; font-size: 14px; line-height: 22px;">
                  Thank you,<br />
                  <strong style="color: #ffffff;">${siteConfig.name}</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function createTicketCreatedEmailHtml({
  ticketId,
  category,
  description,
}: TicketCreatedEmailOptions): string {
  return createSupportNotificationEmailHtml({
    title: "A new support ticket was created",
    summary: "A client created a new support ticket and is waiting for assistance.",
    ticketId,
    details: [
      category ? ["Category", category] : undefined,
      description ? ["Description", description] : undefined,
    ],
    buttonLabel: "View New Ticket",
  });
}

export function createClientTicketResponseEmailHtml({
  ticketId,
  message,
}: ClientTicketResponseEmailOptions): string {
  return createSupportNotificationEmailHtml({
    title: "A client responded to a support ticket",
    summary: "A client added a new response to an existing support ticket.",
    ticketId,
    details: [message ? ["Response", message] : undefined],
    buttonLabel: "View Client Response",
  });
}

interface SupportNotificationEmailOptions {
  title: string;
  summary: string;
  ticketId: string;
  details: Array<readonly [string, string] | undefined>;
  buttonLabel: string;
}

function createSupportNotificationEmailHtml({
  title,
  summary,
  ticketId,
  details,
  buttonLabel,
}: SupportNotificationEmailOptions): string {
  const detailRows = details
    .filter((detail): detail is readonly [string, string] => Boolean(detail))
    .map(([label, value]) => `
      <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 24px;">
        <strong style="color: #ffffff;">${escapeHtml(label)}:</strong><br />
        ${escapeHtml(value).replace(/\n/g, "<br />")}
      </p>`)
    .join("");
  const ticketUrl = `${siteConfig.origin}/support/tickets/${encodeURIComponent(ticketId)}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f172a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px;">
            <tr>
              <td style="padding: 40px;">
                <!--
                <img
                  src="${siteConfig.origin}/logo.svg"
                  alt="${siteConfig.name}"
                  width="160"
                  style="display: block; width: 160px; max-width: 100%; height: auto; margin: 0 0 24px; border: 0;"
                />
                -->
                <h1 style="margin: 0 0 20px; color: #ffffff; font-size: 26px; line-height: 34px;">
                  ${escapeHtml(title)}
                </h1>
                <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 24px;">
                  ${escapeHtml(summary)}
                </p>
                <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 24px;">
                  Ticket: <strong style="color: #ffffff;">${escapeHtml(ticketId)}</strong>
                </p>
                ${detailRows}
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px;">
                  <tr>
                    <td bgcolor="#2563eb" style="border-radius: 8px;">
                      <a
                        href="${ticketUrl}"
                        target="_blank"
                        style="display: inline-block; padding: 13px 24px; color: #ffffff; font-size: 15px; font-weight: 700; line-height: 20px; text-decoration: none; border-radius: 8px;"
                      >
                        ${escapeHtml(buttonLabel)}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 32px 0 0; color: #94a3b8; font-size: 14px; line-height: 22px;">
                  ${siteConfig.name}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character];
  });
}
