import { defineFunction } from "@aws-amplify/backend";

export const updateProductData = defineFunction({
  name: "UpdateProductData",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
