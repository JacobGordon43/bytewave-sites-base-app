'use client';
import { iconLabel } from "../../utils/presentation";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createTicket } from '../../redux/ticketsSlice';
import { useAuth } from '../../auth/AuthContext';
import type { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
interface Props {
    open: boolean;
    onClose: () => void;
}
export default function DomainChangeModal({ open, onClose }: Props) {
    const auth = useAuth();
    const [confirmed, setConfirmed] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [ownership, setOwnership] = useState<'owned' | 'acquire' | ''>('');
    const [ticketId, setTicketId] = useState<string | null>(null);
    const dispatch = useDispatch<AppDispatch>();
    const ticketSlice = useSelector((state: RootState) => state.tickets);
    useEffect(() => {
        if (!open) {
            setConfirmed(false);
            setNewDomain('');
            setOwnership('');
            setTicketId(null);
        }
    }, [open]);
    if (!open)
        return null;
    const canSubmit = confirmed && ownership !== '' && newDomain.trim().length > 0;
    const runDomainChangeRequest = async () => {
        const category = "Domain Change Request";
        const description = `Client has requested a domain change to ${newDomain}. Ownership status: ${ownership === "owned" ? "Client owns the domain" : "Client does not own domain."}.`;
        const formData = new FormData();
        formData.append("category", category);
        formData.append("description", description);
        const createdTicket = await dispatch(createTicket({ formData, userId: auth?.sub || "" })).unwrap();
        if (!createdTicket || !createdTicket.id) {
            throw new Error("Ticket not created.");
        }
        setTicketId(createdTicket.id);
    };
    return (<div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="w-full max-w-lg">
        {ticketId ? (<div>
            <div className="w-16 h-16 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-check-line text-green-400 text-3xl")}</span>
            </div>
            <h3>Ticket {ticketId} was created</h3>
            <p>
              Your domain change request has been submitted. Our team will follow up shortly.
            </p>
            <Link to={`/support/tickets/${ticketId}`} className="inline-flex items-center">
              <span>View Ticket {ticketId}</span>
              <span aria-hidden="true">{iconLabel("ri-arrow-right-line")}</span>
            </Link>
            <button onClick={onClose} className="block w-full">
              Close
            </button>
          </div>) : (<div>
            <div className="flex justify-between items-center">
              <h3>Request Domain Change</h3>
              <button onClick={onClose} className="w-6 h-6 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
              </button>
            </div>

            <div>
              <div>
                <label className="block">
                  New Domain Name
                </label>
                <input className="w-full" type="text" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="example.com"/>
              </div>

              <div>
                <label className="block">
                  Domain Ownership
                </label>
                <div>
                  <label className="flex items-start">
                    <input className="w-4 h-4" type="radio" name="domainOwnership" checked={ownership === 'owned'} onChange={() => setOwnership('owned')}/>
                    <span>
                      I already own the new domain.
                    </span>
                  </label>
                  <label className="flex items-start">
                    <input className="w-4 h-4" type="radio" name="domainOwnership" checked={ownership === 'acquire'} onChange={() => setOwnership('acquire')}/>
                    <span>
                      I need you to get the domain name for me.
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-start">
                  <input className="w-4 h-4" type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}/>
                  <span>
                    I understand there may be a fee plus new domain name charges associated with this change.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex">
              <button className="flex-1" onClick={onClose}>
                Cancel
              </button>
              <button onClick={runDomainChangeRequest} disabled={!canSubmit || ticketSlice.loadingCreate} className="flex-1 flex items-center justify-center">
                {ticketSlice.loadingCreate ? (<>
                    <span aria-hidden="true">{iconLabel("ri-loader-4-line animate-spin")}</span>
                    <span>Submitting...</span>
                  </>) : (<span>Submit Request</span>)}
              </button>
            </div>
          </div>)}
      </div>
    </div>);
}
