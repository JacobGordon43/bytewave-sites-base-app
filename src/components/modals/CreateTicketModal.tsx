import { iconLabel } from "../../utils/presentation";
import type { FormEvent } from "react";
import FeedbackMessage from "../FeedbackMessage";
type CreateTicketModalProps = {
    modalOpen: boolean;
    error: string | null;
    ticketRef: React.RefObject<HTMLFormElement | null>;
    loadingUpload: boolean;
    onClose: () => void;
    onSubmit: (e: FormEvent) => void;
    closeError: () => void;
};
export default function CreateTicketModal({ modalOpen, error, ticketRef, onClose, onSubmit, closeError, loadingUpload }: CreateTicketModalProps) {
    if (!modalOpen)
        return null;
    return (<div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="w-full max-w-md">
        <div>
          
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-add-line text-blue-400 text-xl")}</span>
            </div>
            <div>
              <h3>Create Client Project</h3>
              <p>Fill out the form to create a new support ticket</p>
            </div>
          </div>

          
          {error && (<FeedbackMessage type="error" message={error} onClose={closeError}/>)}

          
          <form ref={ticketRef} onSubmit={onSubmit} className="flex flex-col">
            
            <div>
              <label htmlFor="problem-category" className="block">
                Problem Category
              </label>
              <select className="w-full" id="problem-category" name="category" required defaultValue="">
                <option value="" disabled>
                  Select a category
                </option>
                <option value="UI Issue">Website UI Issue</option>
                <option value="Functionality Bug">Website Functionality Bug</option>
                <option value="Performance Issue">Website Performance Issue</option>
                <option value="Mobile Responsiveness">Mobile Responsiveness Problem</option>
                <option value="Content Update">Content/Text Update Needed</option>
                <option value="Design Feedback">Design/UX Feedback</option>
                <option value="Hosting Issue">Hosting or Server Problem</option>
                <option value="Email Problem">Email Not Sending/Receiving</option>
                <option value="Broken Link">Broken Link or Navigation Issue</option>
                <option value="Payment Issue">Payment or Checkout Issue</option>
                <option value="Analytics Issue">Analytics or Tracking Problem</option>
                <option value="SEO Concern">SEO Optimization Concern</option>
                <option value="Security Concern">Security Concern or Vulnerability</option>
                <option value="Feature Request">New Feature or Enhancement Request</option>
                <option value="Account/Login Issue">Account or Login Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            
            <div>
              <label htmlFor="ticket-description" className="block">
                Ticket Details
              </label>
              <textarea className="w-full" id="ticket-description" name="description" rows={4} required/>
            </div>

            
            <div className="flex">
              <button className="flex-1" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="flex-1" type="submit">
                {loadingUpload ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>);
}
