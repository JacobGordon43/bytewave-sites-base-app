import { defineFunction } from "@aws-amplify/backend";

export const deleteProductData = defineFunction({
  name: "DeleteProductData",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
