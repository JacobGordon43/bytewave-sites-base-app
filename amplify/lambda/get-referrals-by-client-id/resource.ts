import { defineFunction } from "@aws-amplify/backend";

export const getReferralsByClientId = defineFunction({
  name: "GetReferralsByClientId",
  resourceGroupName: "query-functions",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
