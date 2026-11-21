import {defineFunction} from "@aws-amplify/backend";

export const sendEmail = defineFunction({
    name: "SendEmail",
    entry: "./handler.ts",
    timeoutSeconds: 30
})