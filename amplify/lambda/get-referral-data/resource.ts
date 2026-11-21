import {defineFunction} from "@aws-amplify/backend";

export const getReferralData = defineFunction({
    name: "GetReferralData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
