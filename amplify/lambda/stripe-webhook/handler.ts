/**
 * EventBridge entry point (despite the legacy "webhook" folder name).
 * This is not an API Gateway handler: there is no browser JWT or HTTP response.
 * Validate the event envelope, then dispatch to the shared persistence functions.
 * Throw on processing failure so AWS retries and ultimately retains the failed event.
 */
import type { EventBridgeEvent } from "aws-lambda";
import type Stripe from "stripe";
import { reconcileSession, releaseExpiredSession } from "../shared/stripe-payment";
import { stripeClient } from "../shared/stripe-payment";
import {
  closeUnpaidSubscriptionBill,
  reconcileSubscriptionInvoice,
  syncSubscription,
} from "../shared/stripe-subscriptions";

export const subscriptionEvents = [
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];
const supportedEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
  ...subscriptionEvents,
]);

export const createStripeEventHandler =
  (getStripe = stripeClient) =>
  async (event: EventBridgeEvent<string, Stripe.Event>) => {
    const {
      STRIPE_EVENT_SOURCE: source,
      STRIPE_EVENT_ACCOUNT: account,
      STRIPE_EVENT_REGION: region,
      STRIPE_EVENT_MODE: mode,
    } = process.env;
    if (!source || !account || !region || (mode !== "test" && mode !== "live")) {
      throw new Error("Stripe EventBridge configuration is missing.");
    }
    // The rule's Lambda resource permission is the authorization boundary.
    // These checks additionally catch misrouted/manual invocations.
    if (event.source !== source || event.account !== account || event.region !== region) {
      throw new Error("Unexpected Stripe EventBridge source, account, or region.");
    }
    const notification = event.detail;
    if (
      !notification ||
      notification.object !== "event" ||
      !notification.id ||
      typeof notification.type !== "string"
    ) {
      throw new Error("Expected a Stripe snapshot event in EventBridge detail.");
    }
    if (notification.livemode !== (mode === "live"))
      throw new Error("Stripe event mode does not match this deployment.");
    if (notification.account)
      throw new Error("Connected-account events are not supported by this single-account handler.");
    if (!supportedEvents.has(notification.type)) return;
    // Invoice events own subscription payment receipts and hosting grants.
    // The shared function ignores unpaid invoices after refreshing subscription status.
    if (notification.type.startsWith("invoice.")) {
      const invoice = notification.data?.object;
      if (!invoice || invoice.object !== "invoice") throw new Error("Expected an Invoice snapshot");
      // Retrieve using our API version; older destination snapshots may use a different invoice shape.
      const stripe = getStripe();
      await reconcileSubscriptionInvoice(await stripe.invoices.retrieve(invoice.id), stripe);
      return;
    }
    // Lifecycle events own status/cancellation, not payment entitlement.
    // An updated event can mean cancellation was scheduled; deleted means it ended.
    if (notification.type.startsWith("customer.subscription.")) {
      const subscription = notification.data?.object;
      if (!subscription || subscription.object !== "subscription")
        throw new Error("Expected a Subscription snapshot");
      if (subscription.metadata.bytewaveSubscription !== "1") return;
      // Fetch current state so a delayed event cannot restore an outdated status.
      const current = await getStripe().subscriptions.retrieve(subscription.id);
      await syncSubscription(current);
      await closeUnpaidSubscriptionBill(current);
      return;
    }
    // Checkout events finish one-time payments or sync the initial subscription.
    // They do not grant subscription hosting; invoice.paid does that independently.
    const session = notification.data?.object;
    if (!session || session.object !== "checkout.session")
      throw new Error("Expected a Checkout Session snapshot.");
    // Other Checkout Sessions in the same Stripe account don't belong to this app.
    if (!session.metadata?.attempt) return;
    if (notification.type === "checkout.session.expired") {
      if (
        !session.metadata.businessId ||
        !session.metadata.paymentId ||
        !session.metadata.clientId ||
        session.status !== "expired"
      ) {
        throw new Error("Incomplete expired payment session.");
      }
      await releaseExpiredSession(session);
    } else {
      await reconcileSession(session);
    }
    // Deliberately let errors escape: an HTTP-style 500 return would be considered
    // successful by Lambda and would bypass retries and the failure destination.
  };
export const handler = createStripeEventHandler();
