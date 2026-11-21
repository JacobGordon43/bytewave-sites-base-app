import {defineFunction} from "@aws-amplify/backend";

export const updateBusinessInfoData = defineFunction({
    name: "UpdateBusinessInfoData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
