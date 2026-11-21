import {defineFunction} from "@aws-amplify/backend";

export const deleteTicketData = defineFunction({
    name: "DeleteTicketData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
