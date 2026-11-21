import {defineFunction} from "@aws-amplify/backend";

export const deleteBusinessInfoData = defineFunction({
    name: "DeleteBusinessInfoData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
