import {defineFunction} from "@aws-amplify/backend";

export const getPaymentData = defineFunction({
    name: "GetPaymentData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
