import {defineFunction} from "@aws-amplify/backend";

export const createServiceData = defineFunction({
    name: "CreateServiceData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
