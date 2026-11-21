import { iconLabel } from "../../utils/presentation";
import type { FormEvent } from "react";
import FeedbackMessage from "../FeedbackMessage";
type CreateClientModalProps = {
    modalOpen: boolean;
    error: string | null;
    clientRef: React.RefObject<HTMLFormElement | null>;
    onClose: () => void;
    onSubmit: (e: FormEvent) => void;
    closeError: () => void;
    isLoading: boolean;
};
export default function CreateClientModal({ modalOpen, error, clientRef, onClose, onSubmit, closeError, isLoading }: CreateClientModalProps) {
    if (!modalOpen)
        return null;
    return (<div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center overlay" onClick={onClose}>
  
  <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
    <div>
            
            <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-user-add-line text-blue-400 text-xl")}</span>
                </div>
                <div>
                <h3>Create Client</h3>
                <p>
                    Fill out the form to create a new client
                </p>
                </div>
            </div>

            
            {error && (<FeedbackMessage type="error" message={error} onClose={closeError}/>)}

            
            <form ref={clientRef} onSubmit={onSubmit} className="flex flex-col">
                
                <div>
                <label className="block">
                    Business Name
                </label>
                <input className="w-full" type="text" name="businessName" required placeholder="Enter business name"/>
                </div>

                
                <div>
                <label className="block">
                    Email
                </label>
                <input className="w-full" type="email" name="clientEmail" required placeholder="Enter client email"/>
                </div>
                
                <div>
                <label className="block">
                    Phone Number
                </label>
                <input className="w-full" type="phone" name="clientPhone" required placeholder="Enter client phone number"/>
                </div>

                
                <div>
                <label className="block">
                    Client First Name
                </label>
                <input className="w-full" type="text" name="clientFirstName" placeholder="Enter client first name"/>
                </div>
                
                <div>
                <label className="block">
                    Client Last Name
                </label>
                <input className="w-full" type="text" name="clientLastName" placeholder="Enter client last name"/>
                </div>
                
                <div>
                <label className="block">
                    Referred By (Optional)
                </label>
                <input className="w-full" type="text" name="referredBy" placeholder="Who referred this client?"/>
                </div>

                
                <div>
                <label className="block">
                    Services Needed
                </label>
                <div className="flex flex-col">
                    <label className="flex items-center">
                    <input type="checkbox" value="Website Development" name="services"/>
                    <span>Website Development</span>
                    </label>
                    <label className="flex items-center">
                    <input type="checkbox" value="Hosting" name="services"/>
                    <span>Hosting</span>
                    </label>
                    <label className="flex items-center">
                    <input type="checkbox" value="Cloud Infrastructure" name="services"/>
                    <span>Cloud Infrastructure</span>
                    </label>
                </div>
                </div>

                
                <div>
                <label className="block">
                    Project Description
                </label>
                <textarea className="w-full" name="clientDescription" rows={4} required placeholder="Describe the project..."/>
                </div>

                
                <div className="flex">
                <button className="flex-1" type="button" onClick={onClose}>
                    Cancel
                </button>
                <button className="flex-1" type="submit" disabled={isLoading}>
                    {!isLoading ? "Submit" : "Submititng"}
                </button>
                </div>
            </form>
        </div>
  </div>

  <style>{`
    /* Hide scrollbar but allow scroll */
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
