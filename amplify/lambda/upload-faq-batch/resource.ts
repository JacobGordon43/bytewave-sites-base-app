import {defineFunction} from "@aws-amplify/backend";

export const uploadFAQBatch = defineFunction({
    name: "UploadFAQBatch",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
