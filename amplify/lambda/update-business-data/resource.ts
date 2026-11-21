import {defineFunction} from "@aws-amplify/backend";

export const updateBusinessData = defineFunction({
    name: "UpdateBusinessData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
