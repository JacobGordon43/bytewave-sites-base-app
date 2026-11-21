import {defineFunction} from "@aws-amplify/backend";

export const deleteReferralData = defineFunction({
    name: "DeleteReferralData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
