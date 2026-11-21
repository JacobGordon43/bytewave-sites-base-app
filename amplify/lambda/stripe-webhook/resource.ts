/**
 * Amplify Lambda declaration. Secrets/environment are supplied here;
 * API routes, DynamoDB permissions and EventBridge wiring are in amplify/backend.ts.
 */
import { defineFunction, secret } from "@aws-amplify/backend";

export const stripeWebhook = defineFunction({
  name: "StripeWebhook",
  resourceGroupName: "update-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  environment: { STRIPE_SECRET_KEY: secret("STRIPE_SECRET_KEY") },
  // Legacy construct name retained; this function now receives EventBridge events.
});
