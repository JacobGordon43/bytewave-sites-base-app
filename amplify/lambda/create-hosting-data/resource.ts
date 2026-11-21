import {defineFunction} from "@aws-amplify/backend";

export const createHostingData = defineFunction({
    name: "CreateHostingData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
