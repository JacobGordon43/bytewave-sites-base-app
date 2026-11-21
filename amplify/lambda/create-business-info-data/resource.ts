import {defineFunction} from "@aws-amplify/backend";

export const createBusinessInfoData = defineFunction({
    name: "CreateBusinessInfoData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
