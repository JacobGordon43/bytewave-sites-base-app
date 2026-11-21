import {defineFunction} from "@aws-amplify/backend";

export const updateEventData = defineFunction({
    name: "UpdateEventData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})