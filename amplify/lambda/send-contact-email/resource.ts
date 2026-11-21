import { defineFunction } from "@aws-amplify/backend";

export const sendContactEmail = defineFunction({
  name: "SendContactEmail",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
