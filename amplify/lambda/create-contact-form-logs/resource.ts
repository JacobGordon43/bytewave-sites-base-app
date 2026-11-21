import { defineFunction, secret } from "@aws-amplify/backend";

export const createContactFormLogs = defineFunction({
    name: "CreateContactFormLogs",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30,
    environment: {
        TURNSTILE_SECRET_KEY: secret("TURNSTILE_SECRET_KEY")
    }
})
