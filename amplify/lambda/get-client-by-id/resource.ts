import { defineFunction } from "@aws-amplify/backend";

export const getClientById = defineFunction({
  name: "GetClientById",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
