import {defineFunction} from "@aws-amplify/backend";

export const batchDeleteCustomPage = defineFunction({
    name: "BatchDeleteCustomPage",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})