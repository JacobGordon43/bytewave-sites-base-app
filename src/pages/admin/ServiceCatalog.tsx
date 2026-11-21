import { uiClasses } from "../../utils/presentation";
import { billingButtonStyles } from "../../components/billingButtonStyles";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import DashboardLayout from "../../components/DashboardLayout";
import FeedbackMessage from "../../components/FeedbackMessage";
import { useStripeCatalog } from "../../redux/useStripeCatalog";
import { catalogProductAdded } from "../../redux/stripeCatalogSlice";
import type { AppDispatch } from "../../redux/store";
import { catalogError, createCatalogProduct } from "../../services/catalogService";
import type { NewCatalogProduct } from "../../types/catalogTypes";
const inputClass = "w-full mt-1 p-3 rounded-lg bg-slate-700 border border-slate-600 text-white";
const emptyForm = {
    name: "",
    description: "",
    amount: "",
    interval: "one_time" as NewCatalogProduct["interval"],
    published: false,
    hosting: false,
};
export default function ServiceCatalog() {
    const { products, loading, error, refresh, owner } = useStripeCatalog();
    const dispatch = useDispatch<AppDispatch>();
    const [search, setSearch] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const attempt = useRef({ fingerprint: "", requestId: "" });
    const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (saving)
            return;
        const fingerprint = JSON.stringify(form);
        if (attempt.current.fingerprint !== fingerprint)
            attempt.current = { fingerprint, requestId: crypto.randomUUID() };
        setSaving(true);
        setSaveError(null);
        setSuccess(null);
        try {
            const product = await createCatalogProduct({
                ...form,
                amount: Number(form.amount),
                requestId: attempt.current.requestId,
            });
            dispatch(catalogProductAdded({ owner, product }));
            setForm(emptyForm);
            setShowForm(false);
            attempt.current = { fingerprint: "", requestId: "" };
            setSuccess(`${product.name} was added to Stripe and is available in your catalog.`);
        }
        catch (error) {
            setSaveError(catalogError(error));
        }
        finally {
            setSaving(false);
        }
    };
    const filtered = products.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase()));
    return (<DashboardLayout currentPage="service-catalog" linkType="admin">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1>Service Catalog</h1>
            <p>
              Manage the Stripe services and prices used on client bills.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={refresh} disabled={loading || saving} className={uiClasses(billingButtonStyles.secondary)}>
              Refresh
            </button>
            <button onClick={() => setShowForm(true)} disabled={saving} className={uiClasses(billingButtonStyles.primary)}>
              Add service
            </button>
          </div>
        </div>
        {error && (<p role="alert">
            {error}
          </p>)}
        {success && (<FeedbackMessage type="success" message={success} onClose={() => setSuccess(null)}/>)}
        {showForm && (<form onSubmit={submit}>
            <h2>New service</h2>
            {saveError && (<FeedbackMessage type="error" message={saveError} onClose={() => setSaveError(null)}/>)}
            <fieldset disabled={saving}>
              <label className="block">
                Name
                <input required maxLength={250} className={uiClasses(inputClass)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
              </label>
              <label className="block">
                Description
                <textarea maxLength={2000} rows={3} className={uiClasses(inputClass)} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/>
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <label>
                  Price (USD, before tax)
                  <input required type="number" min="0" max="999999.99" step="0.01" className={uiClasses(inputClass)} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}/>
                </label>
                <label>
                  Billing
                  <select className={uiClasses(inputClass)} value={form.interval} onChange={(e) => setForm({
                ...form,
                interval: e.target.value as NewCatalogProduct["interval"],
            })}>
                    <option value="one_time">One-time</option>
                    <option value="month">Monthly subscription</option>
                    <option value="six_months">Every six months</option>
                    <option value="year">Yearly subscription</option>
                  </select>
                </label>
              </div>
              {form.interval !== "one_time" && (<p>
                  Clients can authorize this recurring price through a subscription bill.
                  {form.interval === "six_months" &&
                    " Enter the total price charged every six months."}
                </p>)}
              <label className="flex gap-2 items-center">
                <input type="checkbox" checked={form.hosting} onChange={(e) => setForm({ ...form, hosting: e.target.checked })}/>{" "}
                Hosting service — successful subscription payments grant hosting time
              </label>
              <label className="flex gap-2 items-center">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })}/>{" "}
                Publish this service and its default price in the public catalog
              </label>
              <p>
                Services are saved to the Stripe account configured for this deployment. Use the
                Stripe Dashboard to archive services or create replacement prices.
              </p>
              <div className="flex gap-3">
                <button disabled={saving || loading} className={uiClasses(billingButtonStyles.primary)}>
                  {saving ? "Saving…" : "Create service"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className={uiClasses(billingButtonStyles.secondary)}>
                  Cancel
                </button>
              </div>
            </fieldset>
          </form>)}
        <input aria-label="Search services" className={uiClasses(inputClass)} placeholder="Search services by name or description…" value={search} onChange={(e) => setSearch(e.target.value)}/>
        {loading && (<p role="status">
            Loading Stripe catalog…
          </p>)}
        {!loading && !filtered.length && (<p>
            {search
                ? "No matching services."
                : "No services yet. Add your first service to start building bills."}
          </p>)}
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.map((product) => (<article key={product.id}>
              <div>
                <h2>{product.name}</h2>
                <p>
                  {product.hosting ? "Hosting · " : ""}
                  {product.active ? "Active" : "Archived"} ·{" "}
                  {product.published ? "Published" : "Private"}
                </p>
              </div>
              {product.description && (<p>{product.description}</p>)}
              <ul>
                {product.prices.map((price) => (<li key={price.id}>
                    {price.amount === null
                    ? "Variable pricing"
                    : `${price.currency.toUpperCase()} ${price.amount.toFixed(2)}`}
                    {price.interval
                    ? ` / ${price.intervalCount > 1 ? price.intervalCount + " " : ""}${price.interval}${price.intervalCount > 1 ? "s" : ""}`
                    : " one-time"}
                    <span className="block">
                      {!price.active
                    ? "Archived price"
                    : price.billable
                        ? "Available for bills"
                        : price.interval
                            ? "Available for subscriptions"
                            : "Not supported by one-time USD bills"}
                    </span>
                  </li>))}
              </ul>
              {!product.prices.length && (<p>
                  No reusable prices. Add a price in Stripe to use this service on bills.
                </p>)}
            </article>))}
        </div>
      </div>
    </DashboardLayout>);
}
