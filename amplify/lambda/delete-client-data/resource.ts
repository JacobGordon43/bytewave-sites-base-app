import {defineFunction} from "@aws-amplify/backend";

export const deleteClientData = defineFunction({
    name: "DeleteClientData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
