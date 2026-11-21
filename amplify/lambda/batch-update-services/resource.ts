import {defineFunction} from "@aws-amplify/backend";

export const batchUpdateServices = defineFunction({
    name: "BatchUpdateServices",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
    
})