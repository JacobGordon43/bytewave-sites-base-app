import { uiClasses } from "../utils/presentation";
import { billingButtonStyles } from "./billingButtonStyles";
import { useState } from "react";
import api from "../services/backend/axios";
import { paymentError } from "../services/paymentService";
import { useSubscriptions, type UseSubscriptionsResult, } from "../hooks/useSubscriptions";
interface SubscriptionsPanelProps {
    clientId?: string;
    admin?: boolean;
    onRefresh?: () => void;
    subscriptionState?: UseSubscriptionsResult;
}
export default function SubscriptionsPanel(props: SubscriptionsPanelProps) {
    if (props.subscriptionState) {
        return (<SubscriptionsPanelContent subscriptionState={props.subscriptionState} admin={props.admin ?? false}/>);
    }
    return <SubscriptionsPanelLoader {...props}/>;
}
function SubscriptionsPanelLoader({ clientId, admin = false, onRefresh, }: SubscriptionsPanelProps) {
    const subscriptionState = useSubscriptions({ clientId, admin, onRefresh });
    return <SubscriptionsPanelContent subscriptionState={subscriptionState} admin={admin}/>;
}
function SubscriptionsPanelContent({ subscriptionState, admin, }: {
    subscriptionState: UseSubscriptionsResult;
    admin: boolean;
}) {
    const { subscriptions: items, error: subscriptionError, loading, refreshSubscriptions, } = subscriptionState;
    const [actionError, setActionError] = useState("");
    const [busy, setBusy] = useState("");
    const [confirmId, setConfirmId] = useState("");
    const error = actionError || subscriptionError;
    function refreshPanel() {
        setActionError("");
        refreshSubscriptions();
    }
    async function action(id: string, type: "cancel" | "portal") {
        setBusy(id);
        setActionError("");
        try {
            const { data } = await api.post(`/app/subscriptions/${encodeURIComponent(id)}/${type}`);
            if (type === "portal")
                window.location.assign(data.result.url);
            else {
                setConfirmId("");
                refreshSubscriptions();
            }
        }
        catch (error) {
            setActionError(paymentError(error));
        }
        finally {
            setBusy("");
        }
    }
    return (<section id="subscriptions">
      <div className="flex items-center justify-between gap-3">
        <h2>Subscriptions</h2>
        <button type="button" disabled={loading || Boolean(busy)} onClick={refreshPanel} className={uiClasses(billingButtonStyles.secondary)}>
          Refresh
        </button>
      </div>
      {error && (<p role="alert">
          {error}
        </p>)}
      {loading && (<p role="status">
          Loading subscriptions…
        </p>)}
      {!loading && !error && !items.length && (<p>
          No subscriptions yet. Authorize a recurring bill from Outstanding payments to start one.
        </p>)}
      {items.map((item) => (<article key={item.id}>
          <h3>
            {item.name}
            {item.hosting ? " · Hosting" : ""}
          </h3>
          <p>
            USD {item.amount.toFixed(2)} + tax every {item.intervalCount} {item.interval} ·{" "}
            {item.status.replaceAll("_", " ")}
          </p>
          {Boolean(item.currentPeriodEnd) && (<p>
              {item.cancelAtPeriodEnd ? "Renewals stop at" : "Current Stripe billing period ends"}:{" "}
              {new Date(item.currentPeriodEnd!).toLocaleDateString()}
            </p>)}
          {item.hosting && (<p>
              Hosting coverage is shown in Hosting History / the hosting summary. Canceling stops
              future renewals; paid coverage remains available until its end date.
            </p>)}
          {["past_due", "unpaid", "incomplete"].includes(item.status) && (<p>
              Payment needs attention. Hosting is not extended until the invoice is paid.
            </p>)}
          {item.stripeSubscriptionId && (<div className="flex gap-3 flex-wrap">
              {!admin && (<button type="button" disabled={Boolean(busy)} className={uiClasses(billingButtonStyles.primary)} onClick={() => action(item.id, "portal")}>
                  Manage billing / payment method
                </button>)}
              {!item.cancelAtPeriodEnd &&
                    !["canceled", "incomplete_expired"].includes(item.status) && (<button type="button" disabled={Boolean(busy)} className={uiClasses(billingButtonStyles.danger)} onClick={() => setConfirmId(item.id)}>
                    Cancel future renewals
                  </button>)}
            </div>)}
          {confirmId === item.id && (<div>
              <p>Stop automatic renewal at the end of the current billing period?</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={Boolean(busy)} onClick={() => action(item.id, "cancel")} className={uiClasses(billingButtonStyles.confirmDanger)}>
                  {busy ? "Updating…" : "Confirm cancellation"}
                </button>
                <button type="button" disabled={Boolean(busy)} onClick={() => setConfirmId("")} className={uiClasses(billingButtonStyles.secondary)}>
                  Keep subscription
                </button>
              </div>
            </div>)}
        </article>))}
    </section>);
}
