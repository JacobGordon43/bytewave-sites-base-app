/**
 * Amplify Lambda declaration. Secrets/environment are supplied here;
 * API routes, DynamoDB permissions and EventBridge wiring are in amplify/backend.ts.
 */
import { defineFunction, secret } from "@aws-amplify/backend";

export const createStripeSession = defineFunction({
  name: "CreateStripeSession",
  resourceGroupName: "create-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  environment: {
    STRIPE_SECRET_KEY: secret("STRIPE_SECRET_KEY"),
    PAYMENT_SITE_ORIGIN: process.env.PAYMENT_SITE_ORIGIN || "",
    STRIPE_AUTOMATIC_TAX: process.env.STRIPE_AUTOMATIC_TAX || "false",
  },
});
