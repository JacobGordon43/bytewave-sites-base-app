import { defineFunction } from "@aws-amplify/backend";

export const getProjectData = defineFunction({
  name: "GetProjectData",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
