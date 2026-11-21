import {defineFunction} from "@aws-amplify/backend";

export const getCustomPageData = defineFunction({
    name: "GetCustomPageData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
