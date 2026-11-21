import {defineFunction} from "@aws-amplify/backend";

export const updateCustomPageData = defineFunction({
    name: "UpdateCustomPageData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
