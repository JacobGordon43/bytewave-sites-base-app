/**
 * Infrastructure wiring: import the existing Stripe partner bus and attach our Lambda.
 * The Stripe destination must also select these events; an AWS rule cannot enable them in Stripe.
 */
import { CfnOutput, Duration, RemovalPolicy, Stack, Token } from "aws-cdk-lib";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { EventInvokeConfig, type IFunction } from "aws-cdk-lib/aws-lambda";
import { SqsDestination } from "aws-cdk-lib/aws-lambda-destinations";
import { Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import type { stripeEventsConfig } from "./stripe-events-config";

export function connectStripeEvents(
  fn: IFunction,
  config: NonNullable<ReturnType<typeof stripeEventsConfig>>,
) {
  // Keep the rule and queues in the function's stack to avoid nested-stack cycles.
  const scope = Stack.of(fn);
  if (
    (!Token.isUnresolved(scope.region) && scope.region !== config.region) ||
    (!Token.isUnresolved(scope.account) && scope.account !== config.account)
  ) {
    throw new Error(
      "The Stripe partner bus and Lambda must be deployed in the same AWS account and region.",
    );
  }
  const bus = EventBus.fromEventBusArn(scope, "StripePartnerBus", config.arn);
  const queueProps = {
    retentionPeriod: Duration.days(14),
    encryption: QueueEncryption.SQS_MANAGED,
    enforceSSL: true,
    removalPolicy: RemovalPolicy.RETAIN,
  };
  // Delivery failures mean EventBridge could not hand the event to Lambda.
  // Processing failures mean Lambda accepted it but the handler kept failing.
  const deliveryFailures = new Queue(scope, "StripeEventDeliveryFailures", queueProps);
  const processingFailures = new Queue(scope, "StripeEventProcessingFailures", queueProps);
  const rule = new Rule(scope, "StripeCheckoutEvents", {
    eventBus: bus,
    description: "Process Stripe Checkout snapshot events for this deployment",
    eventPattern: {
      source: [config.source],
      account: [config.account],
      region: [config.region],
      detail: {
        type: [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
          "checkout.session.expired",
          "invoice.paid",
          "invoice.payment_failed",
          "invoice.payment_action_required",
          "customer.subscription.created",
          "customer.subscription.updated",
          "customer.subscription.deleted",
        ],
        livemode: [config.live],
      },
    },
    targets: [
      new LambdaFunction(fn, {
        retryAttempts: 185,
        maxEventAge: Duration.hours(24),
        deadLetterQueue: deliveryFailures,
      }),
    ],
  });
  // EventBridge retries delivery. Lambda separately retries execution failures.
  new EventInvokeConfig(scope, "StripeEventProcessingRetries", {
    function: fn,
    retryAttempts: 2,
    maxEventAge: Duration.hours(6),
    onFailure: new SqsDestination(processingFailures),
  });
  new CfnOutput(scope, "StripeEventRuleArn", { value: rule.ruleArn });
  new CfnOutput(scope, "StripeDeliveryFailureQueueUrl", { value: deliveryFailures.queueUrl });
  new CfnOutput(scope, "StripeProcessingFailureQueueUrl", { value: processingFailures.queueUrl });
  return { deliveryFailures, processingFailures };
}
