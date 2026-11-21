import {defineFunction} from "@aws-amplify/backend";

export const batchDeleteServices = defineFunction({
    name: "BatchDeleteServices",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
    
})