import {defineFunction} from "@aws-amplify/backend";

export const getBusinessInfoData = defineFunction({
    name: "GetBusinessInfoData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
