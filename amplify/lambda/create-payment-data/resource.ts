import {defineFunction, secret} from "@aws-amplify/backend";

export const createPaymentData = defineFunction({
    name: "CreatePaymentData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30,
    environment: {
        STRIPE_SECRET_KEY: secret("STRIPE_SECRET_KEY"),
        VITE_APP_BUSINESS_ID: process.env.VITE_APP_BUSINESS_ID || "",
    }
})
