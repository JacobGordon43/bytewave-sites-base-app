import {defineFunction} from "@aws-amplify/backend";

export const createReferralData = defineFunction({
    name: "CreateReferralData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
