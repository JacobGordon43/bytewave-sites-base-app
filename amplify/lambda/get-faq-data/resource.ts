import {defineFunction} from "@aws-amplify/backend";

export const getFAQData = defineFunction({
    name: "GetFAQData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
