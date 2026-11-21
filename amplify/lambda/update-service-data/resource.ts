import {defineFunction} from "@aws-amplify/backend";

export const updateServiceData = defineFunction({
    name: "UpdateServiceData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
