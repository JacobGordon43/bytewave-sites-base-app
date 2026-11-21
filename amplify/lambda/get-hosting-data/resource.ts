import {defineFunction} from "@aws-amplify/backend";

export const getHostingData = defineFunction({
    name: "GetHostingData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
