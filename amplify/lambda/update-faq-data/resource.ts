import {defineFunction} from "@aws-amplify/backend";

export const updateFAQData = defineFunction({
    name: "UpdateFAQData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
