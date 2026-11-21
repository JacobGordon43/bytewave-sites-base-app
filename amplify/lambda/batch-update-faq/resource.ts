import {defineFunction} from "@aws-amplify/backend";

export const batchUpdateFAQ = defineFunction({
    name: "BatchUpdateFAQ",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})