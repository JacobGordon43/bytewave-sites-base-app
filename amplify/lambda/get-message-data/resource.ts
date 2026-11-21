import {defineFunction} from "@aws-amplify/backend";

export const getMessageData = defineFunction({
    name: "GetMessageData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
