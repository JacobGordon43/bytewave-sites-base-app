import { defineFunction } from "@aws-amplify/backend";

export const getTicketsAfterDate = defineFunction({
  name: "GetTicketsAfterDate",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
