import {defineFunction} from "@aws-amplify/backend";

export const getWorkOrderData = defineFunction({
    name: "GetWorkOrderData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
