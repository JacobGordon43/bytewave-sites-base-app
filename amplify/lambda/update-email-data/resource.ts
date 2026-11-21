import { defineFunction } from "@aws-amplify/backend";

export const updateEmailData = defineFunction({
  name: "UpdateEmailData",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
