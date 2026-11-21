import {defineFunction} from "@aws-amplify/backend";

export const getBeliefData = defineFunction({
    name: "GetBeliefData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})