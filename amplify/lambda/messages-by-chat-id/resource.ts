import {defineFunction} from "@aws-amplify/backend";

export const getMessagesByChatId = defineFunction({
    name: "GetMessagesByChatId",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
