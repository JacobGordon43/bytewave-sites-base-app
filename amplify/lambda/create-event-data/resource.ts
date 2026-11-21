import {defineFunction} from "@aws-amplify/backend";

export const createEventData = defineFunction({
    name: "CreateEventData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})