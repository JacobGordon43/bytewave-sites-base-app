import { defineFunction } from "@aws-amplify/backend";

export const adminCreateUser = defineFunction({
  name: "AdminCreateUser",
  resourceGroupName: "create-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
