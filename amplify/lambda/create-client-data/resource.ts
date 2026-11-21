import {defineFunction} from "@aws-amplify/backend";

export const createClientData = defineFunction({
    name: "CreateClientData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
