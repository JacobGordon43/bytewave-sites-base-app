import {defineFunction} from "@aws-amplify/backend";

export const uploadServicesBatch = defineFunction({
    name: "UploadServicesBatch",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
