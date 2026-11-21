import {defineFunction} from "@aws-amplify/backend";

export const getBusinessData = defineFunction({
    name: "GetBusinessData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
