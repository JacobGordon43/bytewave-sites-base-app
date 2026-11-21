/**
 * Browser API wrappers. Secret-key Stripe calls and ownership checks run in the backend.
 */
import axios from "axios";
import api from "./backend/axios";
import { getPaymentsById } from "./backend/adminDAO";

export type CheckoutSession = {
  billingMode?: "payment" | "subscription";
  interval?: string;
  intervalCount?: number;
  sessionId: string;
  paymentId: string;
  clientSecret: string | null;
  status: "open" | "complete" | "expired";
  paymentStatus: string;
};

export function paymentError(error: unknown): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return error instanceof Error ? error.message : "Unable to load this payment. Please try again.";
}

export async function getClientPayments(clientId: string) {
  const response = await getPaymentsById(clientId);
  return response.data.results;
}

/** Prepare/reuse a saved bill's session. Returns Elements setup data, not a new charge. */
export async function createCheckout(paymentId: string): Promise<CheckoutSession> {
  const { data } = await api.post("/app/payments/stripe/session", { paymentId });
  return data.result;
}

/** Read a session's live status and reconcile it server-side; may still be open/unpaid. */
export async function getCheckout(sessionId: string): Promise<CheckoutSession> {
  const { data } = await api.get(`/app/payments/stripe/session/${encodeURIComponent(sessionId)}`);
  return data.result;
}
