import {defineFunction} from "@aws-amplify/backend";

export const updatePortfolio = defineFunction({
    name: "UpdatePortfolio",
    resourceGroupName: "mutation-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
