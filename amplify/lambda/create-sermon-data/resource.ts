import {defineFunction} from "@aws-amplify/backend";

export const createSermonData = defineFunction({
    name: "CreateSermonData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})