import {defineFunction} from "@aws-amplify/backend";

export const batchDeleteFAQ = defineFunction({
    name: "BatchDeleteFAQ",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})