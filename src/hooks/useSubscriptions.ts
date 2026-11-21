import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/backend/axios";
import { paymentError } from "../services/paymentService";

export interface SubscriptionData {
  id: string;
  name: string;
  amount: number;
  interval: string;
  intervalCount: number;
  hosting: boolean;
  status: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  paidThrough?: number;
}

export function getBillingCycle(subscription?: SubscriptionData): string {
  if (!subscription) return "No Active Subscription";
  if (subscription.interval === "month" && subscription.intervalCount === 1) return "Monthly";
  if (subscription.interval === "month" && subscription.intervalCount === 6) return "Bi-Annual";
  if (subscription.interval === "year" && subscription.intervalCount === 1) return "Annual";

  const unit = subscription.intervalCount === 1
    ? subscription.interval
    : `${subscription.interval}s`;
  return `Every ${subscription.intervalCount} ${unit}`;
}

interface UseSubscriptionsOptions {
  clientId?: string;
  admin?: boolean;
  onRefresh?: () => void;
}

export interface UseSubscriptionsResult {
  subscriptions: SubscriptionData[];
  activeSubscription?: SubscriptionData;
  billingCycle: string;
  error: string;
  loading: boolean;
  refreshSubscriptions: () => void;
}

export function useSubscriptions({
  clientId,
  admin = false,
  onRefresh,
}: UseSubscriptionsOptions): UseSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(clientId));
  const [reloadVersion, setReloadVersion] = useState(0);
  const refreshData = useRef(onRefresh);

  useEffect(() => {
    refreshData.current = onRefresh;
  }, [onRefresh]);

  const refreshSubscriptions = useCallback(() => {
    setReloadVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!clientId) {
      setSubscriptions([]);
      setError("");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    api
      .get("/app/subscriptions", { params: admin ? { clientId } : undefined })
      .then(({ data }) => {
        if (!active) return;
        setSubscriptions(Array.isArray(data.results) ? data.results : []);
        refreshData.current?.();
      })
      .catch((requestError) => {
        if (active) setError(paymentError(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [admin, clientId, reloadVersion]);

  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "visible") refreshSubscriptions();
    };

    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, [refreshSubscriptions]);

  const activeSubscription = subscriptions.find(
    (subscription) =>
      Boolean(subscription.stripeSubscriptionId) &&
      ["active", "trialing"].includes(subscription.status),
  );

  return {
    subscriptions,
    activeSubscription,
    billingCycle: getBillingCycle(activeSubscription),
    error,
    loading,
    refreshSubscriptions,
  };
}
