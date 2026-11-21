import {defineFunction} from "@aws-amplify/backend";

export const createFAQData = defineFunction({
    name: "CreateFAQData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
