import {defineFunction} from "@aws-amplify/backend";

export const updateBeliefData = defineFunction({
    name: "UpdateBeliefData",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})