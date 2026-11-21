/**
 * Deployment-time bus selection and test/live isolation.
 * Returning undefined leaves event wiring disabled until a destination is configured.
 */


export function stripeEventsConfig(deployment: string, env: NodeJS.ProcessEnv = process.env) {
  // Every new application must explicitly select its own Stripe destination.
  const arn =
    env.STRIPE_EVENT_BUS_ARN?.trim() || "";
  if (!arn) return undefined;
  const match = /^arn:aws:events:([^:]+):(\d{12}):event-bus\/(aws\.partner\/stripe\.com\/.+)$/.exec(
    arn,
  );
  if (!match)
    throw new Error("STRIPE_EVENT_BUS_ARN must identify an existing Stripe partner event bus.");
  const mode = env.STRIPE_EVENT_MODE || "";
  if (mode !== "test" && mode !== "live")
    throw new Error("Set STRIPE_EVENT_MODE to test or live for this bus.");

  if (["main", "production", "prod"].includes(deployment) && mode !== "live") {
    throw new Error("Production deployments cannot subscribe to a Stripe sandbox event bus.");
  }
  return {
    arn,
    region: match[1],
    account: match[2],
    source: match[3],
    mode,
    live: mode === "live",
  };
}
