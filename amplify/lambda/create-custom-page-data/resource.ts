import {defineFunction} from "@aws-amplify/backend";

export const createCustomPageData = defineFunction({
    name: "CreateCustomPageData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
