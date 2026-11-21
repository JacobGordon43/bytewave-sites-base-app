import {defineFunction} from "@aws-amplify/backend";

export const deleteBusinessData = defineFunction({
    name: "DeleteBusinessData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
