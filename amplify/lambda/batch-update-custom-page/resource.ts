import {defineFunction} from "@aws-amplify/backend";

export const batchUpdateCustomPage = defineFunction({
    name: "BatchUpdateCustomPage",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})