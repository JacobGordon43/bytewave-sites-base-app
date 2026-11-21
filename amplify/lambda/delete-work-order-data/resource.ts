import {defineFunction} from "@aws-amplify/backend";

export const deleteWorkOrderData = defineFunction({
    name: "DeleteWorkOrderData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
