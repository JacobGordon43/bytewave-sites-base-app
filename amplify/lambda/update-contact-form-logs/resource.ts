import {defineFunction} from "@aws-amplify/backend";

export const updateContactFormLogs = defineFunction({
    name: "UpdateContactFormLogs",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
