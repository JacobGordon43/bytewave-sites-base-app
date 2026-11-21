import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import {
  Alarm, ComparisonOperator, MathExpression, Metric, TreatMissingData,
  type IMetric,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import type { IHttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import type { IEventSourceMapping, IFunction } from "aws-cdk-lib/aws-lambda";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

export interface MonitoringProps {
  environment: string;
  alertEmail: string;
  api: IHttpApi;
  criticalFunctions: Record<string, IFunction>;
  billing: { function: IFunction; mappings: IEventSourceMapping[] };
}

/** All references flow into this stack, keeping the Amplify resource stacks acyclic. */
export function addMonitoring(scope: Stack, props: MonitoringProps) {
  const topic = new Topic(scope, "OperationalAlerts", {
    displayName: `Bytewave ${props.environment} alerts`,
    enforceSSL: true,
  });
  topic.addSubscription(new EmailSubscription(props.alertEmail));
  const action = new SnsAction(topic);
  const period = Duration.minutes(5);
  const alarms: Alarm[] = [];
  const metric = (namespace: string, metricName: string, dimensionsMap: Record<string, string> = {}, statistic = "Sum") =>
    new Metric({ namespace, metricName, dimensionsMap, statistic, period });
  const alarm = (id: string, value: IMetric, threshold: number, description: string, sustained = false) => {
    const resource = new Alarm(scope, id, {
      metric: value,
      threshold,
      evaluationPeriods: sustained ? 3 : 1,
      datapointsToAlarm: sustained ? 2 : 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: `[${props.environment}] ${description} Runbook: docs/monitoring.md (${id}).`,
    });
    resource.addAlarmAction(action);
    resource.addOkAction(action);
    alarms.push(resource);
  };
  const sum = (values: Metric[]) => new MathExpression({
    expression: "SUM(METRICS())",
    usingMetrics: Object.fromEntries(values.map((value, index) => [`m${index}`, value])),
    period,
  });

  // HTTP API metric names are case-sensitive: 5xx, not REST API's 5XXError.
  alarm("ApiServerErrors", metric("AWS/ApiGateway", "5xx", { ApiId: props.api.apiId }), 5,
    "At least five API server errors in five minutes. Inspect the failing routes and Lambda logs.");
  alarm("ApiLatency", metric("AWS/ApiGateway", "Latency", { ApiId: props.api.apiId }, "p95"), 3000,
    "API p95 latency is at least three seconds in two of three five-minute windows. Inspect integration latency and dependencies.", true);

  for (const [name, fn] of Object.entries(props.criticalFunctions)) {
    alarm(`${name}Errors`, fn.metricErrors({ statistic: "Sum", period }), 1,
      `${name} failed an invocation. Inspect its logs; do not replay payments blindly.`);
    alarm(`${name}Throttles`, fn.metricThrottles({ statistic: "Sum", period }), 1,
      `${name} is repeatedly throttled. Inspect concurrency, retries, and account limits.`, true);
  }

  alarm("BillingIteratorAge", metric("AWS/Lambda", "IteratorAge", {
    FunctionName: props.billing.function.functionName,
  }, "Maximum"), 300000, "Billing stream processing is at least five minutes behind. Investigate failed records and throttling.", true);
  alarm("BillingDestinationDeliveryFailures", metric("AWS/Lambda", "DestinationDeliveryFailures", {
    FunctionName: props.billing.function.functionName,
  }), 1, "Billing failed to persist a failure payload. Check the destination bucket and worker permissions.");
  props.billing.mappings.forEach((mapping, index) => {
    const dimensions = { EventSourceMappingUUID: mapping.eventSourceMappingId };
    alarm(`BillingStream${index}FailedRecords`, metric("AWS/Lambda", "FailedInvokeEventCount", dimensions), 1,
      `Billing stream ${index} has repeated failed records, including partial-batch responses. Inspect worker logs and SES configuration.`, true);
    alarm(`BillingStream${index}ExhaustedRecords`, sum([
      metric("AWS/Lambda", "OnFailureDestinationDeliveredEventCount", dimensions),
      metric("AWS/Lambda", "DroppedEventCount", dimensions),
    ]), 1, `Billing stream ${index} exhausted retries or dropped records. Inspect the retained S3 failure payload and replay only after correcting the cause.`);
  });

  new CfnOutput(scope, "AlertTopicArn", { value: topic.topicArn });
  new CfnOutput(scope, "AlertEmail", { value: props.alertEmail });
  return { topic, alarms };
}
