import {defineFunction} from "@aws-amplify/backend";

export const updateHostingData = defineFunction({
    name: "UpdateHostingData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
