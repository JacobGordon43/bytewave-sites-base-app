import { defineFunction } from "@aws-amplify/backend";

export const deleteRentalData = defineFunction({
  name: "DeleteRentalData",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
