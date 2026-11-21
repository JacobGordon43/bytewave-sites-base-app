import { defineFunction } from "@aws-amplify/backend";

export const getProductData = defineFunction({
  name: "GetProductData",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
