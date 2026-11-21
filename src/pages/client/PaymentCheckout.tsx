import { siteConfig } from "../../config/site";
import { uiClasses } from "../../utils/presentation";
import { billingButtonStyles } from "../../components/billingButtonStyles";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { BillingAddressElement, CheckoutElementsProvider, PaymentElement, useCheckoutElements, } from "@stripe/react-stripe-js/checkout";
import { useAuth } from "../../auth/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import FeedbackMessage from "../../components/FeedbackMessage";
import SEO from "../../components/SEO";
import { createCheckout, getCheckout, paymentError, type CheckoutSession, } from "../../services/paymentService";
const publishableKey = import.meta.env.VITE_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
function CheckoutForm({ onConfirmed, session, }: {
    onConfirmed: () => void;
    session: CheckoutSession;
}) {
    const auth = useAuth();
    const [email, setEmail] = useState(auth.email || "");
    const result = useCheckoutElements();
    const [busy, setBusy] = useState(false);
    const submitting = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const [consent, setConsent] = useState(false);
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (result.type !== "success" || submitting.current)
            return;
        submitting.current = true;
        setBusy(true);
        setError(null);
        try {
            const confirmed = await result.checkout.confirm({ redirect: "if_required", email });
            if (confirmed.type === "error")
                setError(confirmed.error.message);
            else
                onConfirmed();
        }
        catch (err) {
            setError(paymentError(err));
        }
        finally {
            submitting.current = false;
            setBusy(false);
        }
    }
    if (result.type === "loading")
        return (<p role="status">
        Loading secure payment form…
      </p>);
    if (result.type === "error")
        return (<p role="alert">
        {result.error.message} Refresh this page to try again.
      </p>);
    const { checkout } = result;
    return (<form onSubmit={submit}>
      <div>
        {checkout.lineItems.map((item) => (<div key={item.id} className="flex justify-between gap-4">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{item.total.amount}</span>
          </div>))}
      </div>
      <div>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{checkout.total.subtotal.amount}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{checkout.total.taxExclusive.amount}</span>
        </div>
        <div className="flex justify-between">
          <span>Total</span>
          <span>{checkout.total.total.amount}</span>
        </div>
      </div>
      <label className="block">
        Email for receipt
        <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="block w-full"/>
      </label>
      {session.billingMode === "subscription" && (<label className="flex items-start gap-3">
          <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)}/>
          <span>
            I authorize recurring charges of {checkout.total.subtotal.amount} plus applicable tax
            every {session.intervalCount || 1} {session.interval || "billing period"}, starting
            today, until canceled. Cancel future renewals from Billing. Paid hosting time is
            retained.
          </span>
        </label>)}
      <BillingAddressElement />
      <PaymentElement onReady={() => setReady(true)} onLoadError={() => setError("The payment form could not load. Refresh this page to try again.")} options={{ layout: "accordion" }}/>
      {error && <FeedbackMessage type="error" message={error} onClose={() => setError(null)}/>}
      <button type="submit" disabled={busy || !ready || (session.billingMode === "subscription" && !consent)} className={uiClasses(`${billingButtonStyles.primary} w-full py-3 font-semibold`)}>
        {busy
            ? "Processing…"
            : `${session.billingMode === "subscription" ? "Subscribe and pay" : "Pay"} ${checkout.total.total.amount}`}
      </button>
      <p>Secure payment powered by Stripe</p>
    </form>);
}
function CheckoutContent({ id }: {
    id: string;
}) {
    const [params, setParams] = useSearchParams();
    const returnedSession = params.get("session_id");
    const [session, setSession] = useState<CheckoutSession | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        const request = returnedSession ? getCheckout(returnedSession) : createCheckout(id);
        request
            .then((value) => {
            if (value.paymentId !== id)
                throw new Error("This checkout belongs to a different payment.");
            if (active)
                setSession(value);
        })
            .catch((err: unknown) => {
            if (active)
                setError(paymentError(err));
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [id, returnedSession, retry]);
    const options = useMemo(() => ({
        clientSecret: session?.clientSecret || "",
        elementsOptions: {
            appearance: {
                theme: "night" as const,
                variables: { colorPrimary: "#3b82f6", colorBackground: "#1e293b" },
            },
        },
    }), [session?.clientSecret]);
    const checkStatus = () => setRetry((value) => value + 1);
    return (<>
      {loading ? (<p role="status">
          Checking payment…
        </p>) : error ? (<>
          <FeedbackMessage type="error" message={error} onClose={() => setError(null)}/>
          <button onClick={checkStatus} className={uiClasses(`${billingButtonStyles.secondary} mt-4`)}>
            Try again
          </button>
        </>) : session?.paymentStatus === "paid" ? (<div role="status">
          <h2>Payment received</h2>
          <p>
            Thank you. Your payment has been confirmed. Hosting subscriptions update after the paid
            invoice is processed; check Billing for the latest coverage.
          </p>
          <Link className={uiClasses(billingButtonStyles.link)} to="/client/billing">
            View billing history
          </Link>
        </div>) : session?.status === "complete" ? (<div role="status">
          <h2>Payment processing</h2>
          <p>Your payment is being confirmed. Please don't submit another payment.</p>
          <button onClick={checkStatus} className={uiClasses(billingButtonStyles.secondary)}>
            Check payment status
          </button>
        </div>) : session?.status === "expired" ? (<div>
          <p>This checkout has expired.</p>
          <button className={uiClasses(billingButtonStyles.secondary)} onClick={() => {
                setParams({});
                checkStatus();
            }}>
            Start a new checkout
          </button>
        </div>) : session?.clientSecret && stripePromise ? (<CheckoutElementsProvider stripe={stripePromise} options={options} key={session.sessionId}>
          <CheckoutForm session={session} onConfirmed={() => {
                setParams({ session_id: session.sessionId });
                checkStatus();
            }}/>
        </CheckoutElementsProvider>) : null}
    </>);
}
export default function PaymentCheckout() {
    const { id } = useParams();
    return (<DashboardLayout currentPage="payments" linkType="client">
      <SEO title={"Bytewave Sites | Secure Payment".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div className="max-w-2xl">
        <Link to="/client/payments">
          ← Outstanding payments
        </Link>
        <div>
          <h1>Complete your payment</h1>
          <p>Payment {id}</p>
        </div>
        <div>
          {!stripePromise ? (<p>{"Online payments are not available yet. Please contact Bytewave Sites for assistance.".replaceAll("Bytewave Sites", siteConfig.name).replaceAll("billing@bytewavesites.com", siteConfig.billingEmail)}</p>) : !id ? (<p role="alert">Payment not found.</p>) : (<CheckoutContent key={id} id={id}/>)}
        </div>
      </div>
    </DashboardLayout>);
}
