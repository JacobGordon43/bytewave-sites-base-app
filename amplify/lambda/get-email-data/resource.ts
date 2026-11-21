import { defineFunction } from "@aws-amplify/backend";

export const getEmailData = defineFunction({
  name: "GetEmailData",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
