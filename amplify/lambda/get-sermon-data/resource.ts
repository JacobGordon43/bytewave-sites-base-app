import {defineFunction} from "@aws-amplify/backend";

export const getSermonData = defineFunction({
    name: "GetSermonData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})