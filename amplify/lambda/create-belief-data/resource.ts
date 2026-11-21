import {defineFunction} from "@aws-amplify/backend";

export const createBeliefData = defineFunction({
    name: "CreateBeliefData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})