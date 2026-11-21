import { defineFunction } from "@aws-amplify/backend";

export const createProductData = defineFunction({
  name: "CreateProductData",
  resourceGroupName: "create-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
