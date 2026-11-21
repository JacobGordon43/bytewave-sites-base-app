import { defineFunction } from "@aws-amplify/backend";

export const deleteProjectData = defineFunction({
  name: "DeleteProjectData",
  resourceGroupName: "mutation-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
