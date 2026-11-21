import { CfnOutput, Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import type { ITableV2 } from "aws-cdk-lib/aws-dynamodb";
import { EventSourceMapping, MetricType, StartingPosition, type IFunction } from "aws-cdk-lib/aws-lambda";
import { S3OnFailureDestination } from "aws-cdk-lib/aws-lambda-event-sources";
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";

/** Database streams hand committed changes to email processing independently of checkout. */
export function connectBillingNotifications(fn: IFunction, tables: ITableV2[], monitoringEnabled = false) {
  const scope = Stack.of(fn);
  const failures = new Bucket(scope, "BillingNotificationFailures", {
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    removalPolicy: RemovalPolicy.RETAIN,
  });
  const mappings: EventSourceMapping[] = [];
  for (const [index, table] of tables.entries()) {
    if (!table.tableStreamArn)
      throw new Error("Billing notifications require old/new DynamoDB stream images");
    table.grantStreamRead(fn);
    mappings.push(new EventSourceMapping(scope, `BillingNotificationStream${index}`, {
      target: fn,
      eventSourceArn: table.tableStreamArn,
      // Intentionally do not replay historical bills/payments when first enabling email.
      // Wait for mappings to become Enabled before testing or accepting new activity.
      startingPosition: StartingPosition.LATEST,
      batchSize: 10,
      retryAttempts: 100,
      maxRecordAge: Duration.hours(6),
      bisectBatchOnError: true,
      reportBatchItemFailures: true,
      ...(monitoringEnabled ? { metricsConfig: { metrics: [MetricType.EVENT_COUNT] } } : {}),
      onFailure: new S3OnFailureDestination(failures),
    }));
  }
  new CfnOutput(scope, "BillingNotificationFailureBucket", { value: failures.bucketName });
  return { mappings, failures };
}
