import { defineFunction } from "@aws-amplify/backend";

export const createRentalData = defineFunction({
  name: "CreateRentalData",
  resourceGroupName: "create-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
