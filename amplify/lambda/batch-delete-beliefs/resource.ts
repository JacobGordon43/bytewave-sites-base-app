import {defineFunction} from "@aws-amplify/backend";

export const batchDeleteBeliefs = defineFunction({
    name: "BatchDeleteBeliefs",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})