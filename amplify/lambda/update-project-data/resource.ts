import { defineFunction } from "@aws-amplify/backend";

export const updateProjectData = defineFunction({
  name: "UpdateProjectData",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
