import {defineFunction} from "@aws-amplify/backend";

export const updateWorkOrderData = defineFunction({
    name: "UpdateWorkOrderData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
