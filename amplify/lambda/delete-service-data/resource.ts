import {defineFunction} from "@aws-amplify/backend";

export const deleteServiceData = defineFunction({
    name: "deleteServiceData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
