import { iconLabel } from "../../utils/presentation";
import { useState } from "react";
import FeedbackMessage from "../FeedbackMessage";
type CreateHostingModalProps = {
    modalOpen: boolean;
    error: string | null;
    hostingRef: React.RefObject<HTMLFormElement | null>;
    onClose: () => void;
    onSubmit: (e: React.SubmitEvent, months: number, selfHosted: boolean) => void;
    closeError: () => void;
    isLoading: boolean;
};
export default function CreateHostingModal({ modalOpen, error, hostingRef, onClose, onSubmit, closeError, isLoading }: CreateHostingModalProps) {
    const [hostingMonths, setHostingMonths] = useState(0);
    const [selfHosted, setSelfHosted] = useState(false);
    if (!modalOpen)
        return null;
    return (<div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center overlay">
                      

            <form className="w-full max-w-md" ref={hostingRef} onSubmit={(e) => onSubmit(e, hostingMonths, selfHosted)}>
              <div className="flex justify-between items-center">
                <h3>Add Hosting Extension</h3>
                <button onClick={() => onClose()} className="w-6 h-6 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
                </button>
              </div>
              {error && (<FeedbackMessage type="error" message={error} onClose={closeError}/>)}
              <div>
                <div>
                  <label className="block">
                    Number of Months to Add
                  </label>
                  <input className="w-full disabled:opacity-50" name="hosting" type="number" min="1" max="60" value={hostingMonths} disabled={selfHosted} onChange={e => setHostingMonths(parseInt(e.target.value))} placeholder="Enter number of months"/>
                  <p>Enter a value between 1 and 60 months</p>
                  <label className="flex items-center">
                    <input type="checkbox" name="selfHosted" value="selfHosted" onChange={e => setSelfHosted(e.target.checked)}/>
                    <span>Self Hosted</span>
                  </label>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => onClose()}>
                    Cancel
                  </button>
                  <button type="submit" disabled={(!hostingMonths || hostingMonths <= 0) && !selfHosted}>
                    {isLoading ? "Adding..." : "Add Hosting"}
                  </button>
                </div>
              </div>
            </form>
          </div>);
}
