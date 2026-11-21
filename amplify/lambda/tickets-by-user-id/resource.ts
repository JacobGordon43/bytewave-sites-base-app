import {defineFunction} from "@aws-amplify/backend";

export const getTicketsByUserId = defineFunction({
    name: "GetTicketsByUserId",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
