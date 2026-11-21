import {defineFunction} from "@aws-amplify/backend";

export const createWorkOrderData = defineFunction({
    name: "CreateWorkOrderData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
