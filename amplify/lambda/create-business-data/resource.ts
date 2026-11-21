import {defineFunction} from "@aws-amplify/backend";

export const createBusinessData = defineFunction({
    name: "CreateBusinessData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
