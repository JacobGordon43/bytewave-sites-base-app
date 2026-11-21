import {defineFunction} from "@aws-amplify/backend";

export const updateTicketData = defineFunction({
    name: "UpdateTicketData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
