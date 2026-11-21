import {defineFunction} from "@aws-amplify/backend";

export const createMessageData = defineFunction({
    name: "CreateMessageData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
