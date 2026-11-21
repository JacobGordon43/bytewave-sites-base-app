import {defineFunction} from "@aws-amplify/backend";

export const updateMessageData = defineFunction({
    name: "UpdateMessageData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
