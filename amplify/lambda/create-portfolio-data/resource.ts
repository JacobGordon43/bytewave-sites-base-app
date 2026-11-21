import {defineFunction} from "@aws-amplify/backend";

export const createPortfolioData = defineFunction({
    name: "CreatePortfolioData",
    resourceGroupName: "create-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
