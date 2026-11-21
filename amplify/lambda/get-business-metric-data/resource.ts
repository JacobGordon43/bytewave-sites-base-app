import {defineFunction} from "@aws-amplify/backend";

export const getBusinessMetricData = defineFunction({
    name: "GetBusinessMetricsData",
    resourceGroupName: "query-functions",
    entry: "./handler.ts",
    timeoutSeconds: 30
})
