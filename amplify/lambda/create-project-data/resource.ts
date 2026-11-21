import { defineFunction } from "@aws-amplify/backend";

export const createProjectData = defineFunction({
  name: "CreateProjectData",
  resourceGroupName: "create-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
