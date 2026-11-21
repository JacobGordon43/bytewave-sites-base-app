import {defineFunction} from "@aws-amplify/backend";

export const getPresignURL = defineFunction({
    name: "GetPresignURL",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
