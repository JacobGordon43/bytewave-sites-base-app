import { defineFunction } from "@aws-amplify/backend";

export const getTicketById = defineFunction({
  name: "GetTicketById",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
