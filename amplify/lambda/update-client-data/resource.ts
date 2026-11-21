import {defineFunction} from "@aws-amplify/backend";

export const updateClientData = defineFunction({
    name: "UpdateClientData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
