import {defineFunction, secret} from "@aws-amplify/backend";

export const updatePaymentData = defineFunction({
    name: "UpdatePaymentData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30,
    environment: {
        STRIPE_SECRET_KEY: secret("STRIPE_SECRET_KEY"),
        VITE_APP_BUSINESS_ID: process.env.VITE_APP_BUSINESS_ID || "",
    }
})
