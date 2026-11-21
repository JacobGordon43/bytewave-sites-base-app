import {defineFunction} from "@aws-amplify/backend";

export const updateSermonData = defineFunction({
    name: "UpdateSermonData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})