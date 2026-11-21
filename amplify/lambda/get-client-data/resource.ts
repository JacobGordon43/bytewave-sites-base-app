import {defineFunction} from "@aws-amplify/backend";

export const getClientData = defineFunction({
    name: "GetClientData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
