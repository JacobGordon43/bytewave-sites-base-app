import { iconLabel } from "../../utils/presentation";
import CatalogItemPicker from "../CatalogItemPicker";
import { useState } from "react";
import type { PaymentItemData } from "../../types/daoTypes";
import FeedbackMessage from "../FeedbackMessage";
type CreatePaymentModalProps = {
    modalOpen: boolean;
    error: string | null;
    paymentRef: React.RefObject<HTMLFormElement | null>;
    onClose: () => void;
    onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
    closeError: () => void;
    isLoading: boolean;
};
export default function CreatePaymentModal({ modalOpen, error, paymentRef, onClose, onSubmit, closeError, isLoading, }: CreatePaymentModalProps) {
    const [items, setItems] = useState<PaymentItemData[]>([]);
    const [billingMode, setBillingMode] = useState<"payment" | "subscription">("payment");
    const totalAmount = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    const resetItems = () => setItems([]);
    const handleRemoveItem = (itemId: string) => {
        setItems((currentItems) => currentItems.filter(({ id }) => id !== itemId));
    };
    const handleClose = () => {
        if (isLoading)
            return;
        resetItems();
        onClose();
    };
    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
        if (items.length === 0) {
            event.preventDefault();
            return;
        }
        onSubmit(event);
    };
    if (!modalOpen)
        return null;
    return (<div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center overlay" onClick={handleClose}>
      
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div>
          
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-currency-line text-blue-400 text-xl")}</span>
            </div>
            <div>
              <h3>Create Bill</h3>
              <p>
                Add catalog services or custom items to this bill
              </p>
            </div>
          </div>

          
          {error && (<FeedbackMessage type="error" message={error} onClose={closeError}/>)}

          
          <form ref={paymentRef} onSubmit={handleSubmit} className="flex flex-col">
            <input type="hidden" name="billingMode" value={billingMode}/>
            <label>
              Billing type
              <select className="block w-full" disabled={isLoading} value={billingMode} onChange={(e) => {
            setBillingMode(e.target.value as "payment" | "subscription");
            setItems([]);
        }}>
                <option value="payment">One-time payment</option>
                <option value="subscription">Recurring subscription</option>
              </select>
            </label>
            {billingMode === "subscription" && (<p>
                Choose one recurring service. The client authorizes automatic renewals at checkout.
                Hosting is granted only after a successful invoice payment.
              </p>)}
            <input type="hidden" name="amount" value={totalAmount.toFixed(2)}/>
            <input type="hidden" name="items" value={JSON.stringify(items)}/>

            
            <div>
              <CatalogItemPicker key={billingMode} subscription={billingMode === "subscription"} disabled={isLoading || items.length >= (billingMode === "subscription" ? 1 : 100)} onAdd={(item) => setItems((current) => [...current, item])}/>

              {items.length > 0 ? (<div className="max-h-40 overflow-y-auto">
                  {items.map((paymentItem) => (<div key={paymentItem.id} className="flex items-center justify-between gap-3">
                      <span>
                        {paymentItem.item}
                        {paymentItem.recurring
                    ? ` / ${paymentItem.recurring.intervalCount} ${paymentItem.recurring.interval}`
                    : ""}
                        <span className="block">
                          {paymentItem.pricingMode === "override"
                    ? "Custom price"
                    : paymentItem.pricingMode === "catalog"
                        ? "Catalog price"
                        : "Custom item"}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          {paymentItem.quantity} ×{" "}
                          {paymentItem.unitPrice.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                })}{" "}
                          ={" "}
                          {(paymentItem.quantity * paymentItem.unitPrice).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                })}
                        </span>
                        <button type="button" disabled={isLoading} onClick={() => handleRemoveItem(paymentItem.id)} className="w-6 h-6 flex items-center justify-center" aria-label={`Remove ${paymentItem.item}`}>
                          <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
                        </button>
                      </div>
                    </div>))}
                </div>) : (<div>
                  No payment items added yet
                </div>)}

              <div className="flex justify-between items-center">
                <span>Subtotal before tax</span>
                <span>
                  {totalAmount.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
        })}
                </span>
              </div>
            </div>

            
            <div>
              <label className="block">Platform</label>
              <select className="w-full" key={billingMode} name="platform" defaultValue="Stripe" required>
                <option value="" disabled>
                  Select a platform
                </option>
                <option disabled={billingMode === "subscription"} value="Zelle">
                  Zelle
                </option>
                <option disabled={billingMode === "subscription"} value="PayPal">
                  PayPal
                </option>
                <option value="Stripe">Stripe</option>
              </select>
            </div>

            
            <div>
              <label className="block">Payment Date</label>
              <input className="w-full" type="date" name="date" required/>
            </div>

            
            <div className="flex">
              <button className="flex-1" type="button" onClick={handleClose}>
                Cancel
              </button>
              <button className="flex-1" type="submit" disabled={isLoading || items.length === 0}>
                {!isLoading ? "Submit" : "Submitting"}
              </button>
            </div>
          </form>
        </div>
      </div>

      
      <style>{`
        .overlay::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        .overlay {
          -ms-overflow-style: none; /* IE/Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>);
}
