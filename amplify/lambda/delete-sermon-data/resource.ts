import {defineFunction} from "@aws-amplify/backend";

export const deleteSermonData = defineFunction({
    name: "DeleteSermonData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})