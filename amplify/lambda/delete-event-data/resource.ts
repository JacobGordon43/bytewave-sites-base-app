import {defineFunction} from "@aws-amplify/backend";

export const deleteEventData = defineFunction({
    name: "DeleteEventData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})