import {defineFunction} from "@aws-amplify/backend";

export const getTicketData = defineFunction({
    name: "GetTicketData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
