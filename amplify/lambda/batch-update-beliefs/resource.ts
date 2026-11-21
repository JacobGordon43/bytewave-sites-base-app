import {defineFunction} from "@aws-amplify/backend";

export const batchUpdateBeliefs = defineFunction({
    name: "BatchUpdateBeliefs",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})