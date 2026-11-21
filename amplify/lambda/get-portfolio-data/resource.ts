import { defineFunction } from "@aws-amplify/backend";

export const getPortfolioData = defineFunction({
  name: "GetPortfolioData",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
