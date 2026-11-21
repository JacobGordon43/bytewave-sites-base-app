import { defineFunction } from "@aws-amplify/backend";

export const getPaymentsByClientId = defineFunction({
  name: "GetPaymentsByClientId",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
