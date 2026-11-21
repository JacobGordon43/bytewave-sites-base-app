import { defineFunction } from "@aws-amplify/backend";

export const createEmailData = defineFunction({
  name: "CreateEmailData",
  resourceGroupName: "create-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
