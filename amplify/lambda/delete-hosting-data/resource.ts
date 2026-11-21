import {defineFunction} from "@aws-amplify/backend";

export const deleteHostingData = defineFunction({
    name: "DeleteHostingData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
