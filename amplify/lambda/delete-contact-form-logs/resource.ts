import {defineFunction} from "@aws-amplify/backend";

export const deleteContactFormLogs = defineFunction({
    name: "DeleteContactFormLogs",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
