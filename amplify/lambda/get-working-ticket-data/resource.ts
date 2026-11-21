import {defineFunction} from "@aws-amplify/backend";

export const getWorkingTicketData = defineFunction({
    name: "GetWorkingTicketData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
