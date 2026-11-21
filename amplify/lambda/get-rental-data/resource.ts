import { defineFunction } from "@aws-amplify/backend";

export const getRentalData = defineFunction({
  name: "GetRentalData",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
