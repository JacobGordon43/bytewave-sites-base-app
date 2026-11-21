import {defineFunction} from "@aws-amplify/backend";

export const getEventData = defineFunction({
    name: "GetEventData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})