import {defineFunction} from "@aws-amplify/backend";

export const createTicketData = defineFunction({
    name: "CreateTicketData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
