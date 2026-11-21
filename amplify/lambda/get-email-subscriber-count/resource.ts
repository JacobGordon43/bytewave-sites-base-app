import {defineFunction} from "@aws-amplify/backend";

export const getEmailSubscriberCount = defineFunction({
    name: "GetEmailSubscriberCount",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
