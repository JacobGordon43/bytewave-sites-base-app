/** Values belonging to a deployment, not reusable business logic. */
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} for this application before deploying.`);
  return value;
}
const origin = required("PAYMENT_SITE_ORIGIN");
if (!/^https:\/\//.test(origin) || new URL(origin).origin !== origin) throw new Error("PAYMENT_SITE_ORIGIN must be an HTTPS origin without a trailing slash.");
export const applicationConfig = {
  name: required("APPLICATION_NAME"),
  displayName: required("BUSINESS_NAME"),
  imagesBucketName: required("IMAGES_BUCKET_NAME"),
  platformBucketName: required("PLATFORM_STATUS_BUCKET_NAME"),
  supportEmail: required("SUPPORT_EMAIL"),
  billingEmailFrom: required("BILLING_EMAIL_FROM"),
  allowedOrigins: [...new Set([origin, ...(process.env.CORS_ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean)])],
};
required("VITE_APP_BUSINESS_ID");
required("BILLING_NOTIFICATION_EMAIL");
required("HOSTING_NOTIFICATION_EMAIL");
