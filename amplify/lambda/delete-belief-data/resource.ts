import {defineFunction} from "@aws-amplify/backend";

export const deleteBeliefData = defineFunction({
    name: "DeleteBeliefData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})