import {defineFunction} from "@aws-amplify/backend";

export const getServiceData = defineFunction({
    name: "GetServiceData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
