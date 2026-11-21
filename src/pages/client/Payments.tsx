import { siteConfig } from "../../config/site";
import { uiClasses } from "../../utils/presentation";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import FeedbackMessage from "../../components/FeedbackMessage";
import SEO from "../../components/SEO";
import { getClientPayments, paymentError } from "../../services/paymentService";
import type { PaymentData } from "../../types/daoTypes";
export default function Payments() {
    const { sub } = useAuth();
    const [payments, setPayments] = useState<PaymentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState(0);
    useEffect(() => {
        if (!sub)
            return;
        let active = true;
        setError(null);
        getClientPayments(sub).then((items) => {
            if (active)
                setPayments(items.filter((item) => item.clientId === sub));
        }).catch((err: unknown) => { if (active)
            setError(paymentError(err)); })
            .finally(() => { if (active)
            setLoading(false); });
        return () => { active = false; };
    }, [sub, refresh]);
    const outstanding = payments.filter((p) => p.status === "Pending" || p.status === "Overdue");
    return <DashboardLayout currentPage="payments" linkType="client">
    <SEO title={"Bytewave Sites | Payments".replaceAll("Bytewave Sites", siteConfig.name)}/>
    <div className="max-w-5xl">
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div><h1>Outstanding payments</h1>
          <p>Select a payment to review its details and pay securely.</p></div>
        <Link to="/client/billing">Billing history</Link>
      </div>
      {error && <><FeedbackMessage type="error" message={error} onClose={() => setError(null)}/>
        <button onClick={() => setRefresh((value) => value + 1)}>Try again</button></>}
      {loading ? <p role="status">Loading payments…</p> : !error && <>
        <div>
          <p>Total outstanding</p>
          <p>${outstanding.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
          <p>{outstanding.length} outstanding {outstanding.length === 1 ? "payment" : "payments"} · USD</p>
        </div>
        {outstanding.length === 0 ? <div>You're all caught up. No outstanding payments.</div> :
                <ul>{outstanding.map((payment) => <li key={payment.id}>
            <Link to={`/client/payments/${encodeURIComponent(payment.id)}`} className="block">
              <div className="flex flex-wrap justify-between gap-4">
                <div><p>{payment.items.map((item) => `${item.item} × ${item.quantity}`).join(", ") || "Payment"}</p>
                  <p>{payment.billingMode === "subscription" ? `Recurring subscription · every ${payment.items[0]?.recurring?.intervalCount || 1} ${payment.items[0]?.recurring?.interval || "billing period"}` : "One-time payment"}</p>
                  <p>Payment {payment.id}</p>
                  <p>{new Date(payment.date).toLocaleDateString()}</p></div>
                <div><p>${payment.amount.toFixed(2)}</p>
                  <p className={uiClasses(`text-sm mt-1 ${payment.status === "Overdue" ? "text-red-400" : "text-amber-300"}`)}>{payment.status}</p></div>
              </div>
              <p>{payment.platform === "Stripe" ? "Review and pay" : `View ${payment.platform} payment`} <span aria-hidden="true">→</span></p>
            </Link>
          </li>)}</ul>}
      </>}
    </div>
  </DashboardLayout>;
}
