import {defineFunction} from "@aws-amplify/backend";

export const getContactFormLogs = defineFunction({
    name: "GetContactFormLogs",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
