import { defineFunction } from "@aws-amplify/backend";

export const getMetadata = defineFunction({
  name: "GetMetadata",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
