import { defineFunction } from "@aws-amplify/backend";

export const deletePortfolioData = defineFunction({
  name: "DeletePortfolioData",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
