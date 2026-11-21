import { defineFunction } from "@aws-amplify/backend";

export const sendCustomEmail = defineFunction({
  name: "SendCustomEmail",
  resourceGroupName: "create-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
