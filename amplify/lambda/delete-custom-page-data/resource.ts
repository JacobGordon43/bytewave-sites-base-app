import {defineFunction} from "@aws-amplify/backend";

export const deleteCustomPage = defineFunction({
    name: "DeleteCustomPage",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
    
})