import {defineFunction} from "@aws-amplify/backend";

export const deletePaymentData = defineFunction({
    name: "DeletePaymentData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
