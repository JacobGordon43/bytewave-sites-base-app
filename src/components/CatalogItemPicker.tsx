import { uiClasses } from "../utils/presentation";
import { useState } from "react";
import type { PaymentItemData } from "../types/daoTypes";
import { useStripeCatalog } from "../redux/useStripeCatalog";
const field = "w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm";
export default function CatalogItemPicker({ onAdd, disabled, subscription = false, }: {
    subscription?: boolean;
    onAdd: (item: PaymentItemData) => void;
    disabled: boolean;
}) {
    const { products, loading, error, refresh } = useStripeCatalog();
    const [mode, setMode] = useState<"catalog" | "custom">("catalog");
    const [search, setSearch] = useState("");
    const [priceId, setPriceId] = useState("");
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [override, setOverride] = useState(false);
    const [amount, setAmount] = useState("");
    const product = products.find((product) => product.prices.some((price) => price.id === priceId));
    const price = product?.prices.find((price) => price.id === priceId);
    const customAmount = mode === "custom" || override;
    const unitPrice = customAmount ? Number(amount) : price?.amount;
    const valid = !disabled &&
        Number.isSafeInteger(Number(quantity)) &&
        Number(quantity) > 0 &&
        unitPrice !== undefined &&
        unitPrice !== null &&
        Number.isFinite(unitPrice) &&
        unitPrice >= 0 &&
        unitPrice <= 999999.99 &&
        (!customAmount || amount.trim() !== "") &&
        Math.abs(unitPrice * 100 - Math.round(unitPrice * 100)) < 0.00001 &&
        (mode === "custom"
            ? Boolean(name.trim())
            : Boolean(subscription ? price?.subscribable : price?.billable));
    const add = () => {
        if (!valid || unitPrice === null || unitPrice === undefined)
            return;
        onAdd({
            id: crypto.randomUUID(),
            item: mode === "custom" ? name.trim() : product!.name,
            quantity: Number(quantity),
            unitPrice,
            pricingMode: mode === "custom" ? "custom" : override ? "override" : "catalog",
            ...(mode === "catalog"
                ? {
                    stripeProductId: product!.id,
                    stripePriceId: price!.id,
                    ...(subscription
                        ? {
                            recurring: {
                                interval: price!.interval as "month" | "year",
                                intervalCount: price!.intervalCount,
                            },
                            hosting: product!.hosting,
                        }
                        : {}),
                }
                : {}),
        });
        setName("");
        setQuantity("1");
        setAmount("");
        setPriceId("");
        setOverride(false);
    };
    return (<fieldset disabled={disabled} onKeyDown={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
                event.preventDefault();
                add();
            }
        }}>
      <legend>Add a bill item</legend>
      <div className="flex gap-4">
        <label>
          <input type="radio" name="itemSource" checked={mode === "catalog"} onChange={() => setMode("catalog")}/>{" "}
          Catalog
        </label>
        <label>
          <input disabled={subscription} type="radio" name="itemSource" checked={mode === "custom"} onChange={() => setMode("custom")}/>{" "}
          Custom item
        </label>
      </div>
      {mode === "catalog" ? (<>
          <div className="flex items-center gap-2">
            <input aria-label="Search catalog" className={uiClasses(field)} placeholder="Search services…" value={search} onChange={(e) => setSearch(e.target.value)}/>
            <button className="disabled:opacity-50" type="button" disabled={loading} onClick={refresh}>
              Refresh
            </button>
          </div>
          {loading && (<p role="status">
              Loading catalog…
            </p>)}
          {error && (<p role="alert">
              {error} You can still add custom items.
            </p>)}
          <div className="max-h-48 overflow-y-auto" aria-label="Catalog results">
            {products
                .filter((p) => p.active &&
                `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()))
                .map((p) => (<div key={p.id}>
                  <p>{p.name}</p>
                  {p.prices
                    .filter((price) => price.active)
                    .map((price) => (<label key={price.id} className={uiClasses(`flex items-center gap-2 text-sm py-1 ${(subscription ? price.subscribable : price.billable) ? "text-slate-200" : "text-slate-500"}`)}>
                        <input type="radio" name="catalogPrice" checked={priceId === price.id} disabled={!(subscription ? price.subscribable : price.billable) || loading} onChange={() => {
                        setPriceId(price.id);
                        setOverride(false);
                        setAmount("");
                    }}/>
                        {price.amount === null
                        ? "Variable price"
                        : `${price.currency.toUpperCase()} ${price.amount.toFixed(2)}`}
                        {price.interval
                        ? ` / ${price.intervalCount > 1 ? price.intervalCount + " " : ""}${price.interval} — subscription`
                        : !price.billable
                            ? " — unavailable for this bill"
                            : ""}
                      </label>))}
                  {!p.prices.some((price) => price.active) && (<p>No active prices</p>)}
                </div>))}
            {!loading &&
                !products.some((p) => p.active &&
                    `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())) && (<p>
                  No matching services. Create a service in Service Catalog or add a custom item.
                </p>)}
          </div>
          {price && (<p>
              Selected: {product?.name} — ${price.amount?.toFixed(2)}
            </p>)}
          <label className="flex gap-2">
            <input type="checkbox" checked={override} onChange={(e) => {
                setOverride(e.target.checked);
                setAmount(price?.amount?.toFixed(2) || "");
            }}/>{" "}
            Use a custom price for this bill
          </label>
          <p>
            {subscription
                ? "The same price renews each billing period until canceled. Overrides apply to all renewals of this subscription."
                : "This bill charges once. Choose Recurring subscription to use recurring prices."}{" "}
            Overrides do not change the catalog.
          </p>
        </>) : (<label className="block">
          Item name
          <input className={uiClasses(field)} maxLength={250} value={name} onChange={(e) => setName(e.target.value)} placeholder="Custom service or item"/>
        </label>)}
      <div className="grid grid-cols-2 gap-3">
        <label>
          Quantity
          <input className={uiClasses(field)} type="number" min="1" max={subscription ? "1" : "999999"} disabled={subscription} step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}/>
        </label>
        {customAmount && (<label>
            Unit price (USD)
            <input className={uiClasses(field)} type="number" min="0" max="999999.99" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}/>
          </label>)}
      </div>
      <button type="button" disabled={!valid || (mode === "catalog" && loading)} onClick={add}>
        Add to bill
      </button>
    </fieldset>);
}
