import {defineFunction} from "@aws-amplify/backend";

export const deleteService = defineFunction({
    name: "BatchDeleteService",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
