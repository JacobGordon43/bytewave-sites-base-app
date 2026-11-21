import { iconLabel } from "../../utils/presentation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../redux/store";
import React, { useState } from "react";
import { setReferralError } from "../../redux/additionalInfoSlice";
import { selectEnrichedClients } from "../../redux/selectors/clientsSelector";
import FeedbackMessage from "../FeedbackMessage";
type CreateReferralModalProps = {
    modalOpen: boolean;
    currentClientId: string;
    referralError: string | null;
    referralRef: React.RefObject<HTMLFormElement | null>;
    onClose: () => void;
    onSubmit: (referral: string) => void;
    clearReferralError: () => void;
    isLoading: boolean;
};
export default function CreateReferralModal({ modalOpen, currentClientId, referralError, referralRef, onClose, onSubmit, clearReferralError, isLoading }: CreateReferralModalProps) {
    const clients = useSelector(selectEnrichedClients);
    const [referredBy, setReferredBy] = useState("");
    const dispatch = useDispatch<AppDispatch>();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (referredBy == "") {
            dispatch(setReferralError("Must select a referral."));
            return;
        }
        await onSubmit(referredBy);
    };
    const handleClose = () => {
        clearReferralError();
        setReferredBy("");
        onClose();
    };
    if (!modalOpen)
        return null;
    return (<div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="w-full max-w-md">
                      <div className="flex justify-between items-center">
                        <h3>Add Referral</h3>
                        <button onClick={handleClose} className="w-6 h-6 flex items-center justify-center">
                          <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
                        </button>
                      </div>
                      <form ref={referralRef} onSubmit={handleSubmit}>
                        <div>
              {referralError && (<FeedbackMessage type="error" message={referralError} onClose={clearReferralError}/>)}
                          <label className="block">
                            Select Client to Add as Referral
                          </label>
                          <select className="w-full" onChange={(e) => setReferredBy(e.target.value)}>
                            <option value="">Choose a client...</option>
                            {clients.filter(client => client.id === currentClientId).map((client) => (<option key={client.id} value={client.id}>{client.clientFirstName} {client.clientLastName}/{client.businessName}</option>))}
                          </select>
                        </div>
                        <div className="flex justify-end">
                          <button type="button" onClick={handleClose}>
                            Cancel
                          </button>
                          <button type="submit" disabled={isLoading}>
                            {!isLoading ? "Add Referral" : "Adding Referral..."}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>);
}
