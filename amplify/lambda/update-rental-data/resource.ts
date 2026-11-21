import { defineFunction } from "@aws-amplify/backend";

export const updateRentalData = defineFunction({
  name: "UpdateRentalData",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
