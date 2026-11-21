import {defineFunction} from "@aws-amplify/backend";

export const deleteMessageData = defineFunction({
    name: "DeleteMessageData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
