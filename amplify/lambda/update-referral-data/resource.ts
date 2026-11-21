import {defineFunction} from "@aws-amplify/backend";

export const updateReferralData = defineFunction({
    name: "UpdateReferralData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
