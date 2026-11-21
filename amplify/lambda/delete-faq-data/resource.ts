import {defineFunction} from "@aws-amplify/backend";

export const deleteFAQData = defineFunction({
    name: "DeleteFAQData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
