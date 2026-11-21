import { defineFunction } from "@aws-amplify/backend";

export const updatePlatformStatus = defineFunction({
  name: "UpdatePlatformStatus",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
