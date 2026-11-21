/**
 * Amplify Lambda declaration. Secrets/environment are supplied here;
 * API routes, DynamoDB permissions and EventBridge wiring are in amplify/backend.ts.
 */
import { defineFunction, secret } from "@aws-amplify/backend";

export const stripeCatalog = defineFunction({
  name: "StripeCatalog",
  resourceGroupName: "create-functions",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  environment: {
    STRIPE_SECRET_KEY: secret("STRIPE_SECRET_KEY"),
    VITE_APP_BUSINESS_ID: process.env.VITE_APP_BUSINESS_ID || "",
  },
});
