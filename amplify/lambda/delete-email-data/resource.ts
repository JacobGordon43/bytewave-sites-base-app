import {defineFunction} from "@aws-amplify/backend";

export const deleteEmailData = defineFunction({
    name: "DeleteEmailData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
