/**
 * GET /app/payments/stripe/session/{sessionId}: read Stripe's current checkout state.
 * Also reconciles local status or releases an expired reservation; it never creates a charge.
 */
import {
  ApiError,
  assertSafeIdentifier,
  getTenantIdentity,
  response,
} from "../shared/tenant-query";
import type { AuthenticatedApiEvent } from "../shared/types";
import {
  assertPaymentOwner,
  loadPayment,
  reconcileSession,
  releaseExpiredSession,
  sessionResult,
  stripeClient,
} from "../shared/stripe-payment";

export const handler = async (event: AuthenticatedApiEvent) => {
  try {
    const identity = getTenantIdentity(event);
    const id = assertSafeIdentifier(event.pathParameters?.sessionId, "sessionId");
    const session = await stripeClient().checkout.sessions.retrieve(id);
    // A session ID in the URL is not authorization. Validate tenant and client ownership.
    const metadata = session.metadata;
    if (
      !metadata?.paymentId ||
      metadata.businessId !== identity.businessId ||
      metadata.clientId !== identity.subject
    )
      throw new ApiError(404, "Payment not found.");
    const payment = await loadPayment(identity.businessId, metadata.paymentId);
    assertPaymentOwner(payment, identity);
    // One-time payments can complete here; subscriptions only sync IDs/status here.
    // Paid subscription receipts and hosting are handled by invoice events.
    if (session.status !== "expired") await reconcileSession(session);
    else await releaseExpiredSession(session);
    return response(200, { success: true, result: sessionResult(session) });
  } catch (error) {
    if (error instanceof ApiError)
      return response(error.statusCode, { success: false, message: error.message });
    console.error("GetStripeSession failed", error instanceof Error ? error.name : "UnknownError");
    return response(500, {
      success: false,
      message: "Unable to check payment status. Please try again.",
    });
  }
};
