import { defineFunction } from "@aws-amplify/backend";

export const billingNotifications = defineFunction({
  name: "BillingNotifications",
  resourceGroupName: "billing-notifications",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  environment: {
    PAYMENT_SITE_ORIGIN: process.env.PAYMENT_SITE_ORIGIN || "",
    BILLING_EMAIL_FROM: process.env.BILLING_EMAIL_FROM || "",
    BILLING_NOTIFICATION_EMAIL:
      process.env.BILLING_NOTIFICATION_EMAIL || "",
    HOSTING_NOTIFICATION_EMAIL:
      process.env.HOSTING_NOTIFICATION_EMAIL || "",
  },
});
