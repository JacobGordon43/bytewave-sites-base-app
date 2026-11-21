'use client';
import { iconLabel } from "../../utils/presentation";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { createTicket } from '../../redux/ticketsSlice';
import type { AppDispatch } from '../../redux/store';
import { useDispatch } from 'react-redux';
interface Props {
    open: boolean;
    onClose: () => void;
}
export default function HostingCancellationModal({ open, onClose }: Props) {
    const auth = useAuth();
    const [confirmed, setConfirmed] = useState(false);
    const [takeDown, setTakeDown] = useState(false);
    const [noRefund, setNoRefund] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [ticketId, setTicketId] = useState<string | null>(null);
    const dispatch = useDispatch<AppDispatch>();
    useEffect(() => {
        if (!open) {
            setConfirmed(false);
            setTakeDown(false);
            setNoRefund(false);
            setSubmitting(false);
            setTicketId(null);
        }
    }, [open]);
    if (!open)
        return null;
    const canSubmit = confirmed && (!takeDown || noRefund);
    const runCancellationRequest = async () => {
        const category = "Hosting Cancellation Request";
        const description = `Client has requested cancellation of their hosting service. ${takeDown ? "They have requested to take their website down." : "They have requested to keep their website up."} ${noRefund ? "They understand that they will not receive a refund for any unused time." : "There was no acknowledgement of no refund. Please verify."}`;
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
              Your hosting cancellation request has been submitted. Our team will follow up shortly.
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
              <h3>Request Hosting Cancellation</h3>
              <button onClick={onClose} className="w-6 h-6 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
              </button>
            </div>

            <div>
              <p>
                Cancelling your hosting service will stop your website from being served. Please review the options below carefully.
              </p>
            </div>

            <div>
              <label className="flex items-start">
                <input className="w-4 h-4" type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}/>
                <span>
                  I confirm that I want to request cancellation of my hosting service.
                </span>
              </label>

              <label className="flex items-start">
                <input className="w-4 h-4" type="checkbox" checked={takeDown} onChange={(e) => {
                setTakeDown(e.target.checked);
                if (!e.target.checked)
                    setNoRefund(false);
            }}/>
                <span>
                  Take my website down once my request is resolved.
                </span>
              </label>

              {takeDown && (<label className="flex items-start">
                  <input className="w-4 h-4" type="checkbox" checked={noRefund} onChange={(e) => setNoRefund(e.target.checked)}/>
                  <span>
                    I understand that I will not receive a refund for any unused time.
                  </span>
                </label>)}
            </div>

            <div className="flex">
              <button className="flex-1" onClick={onClose}>
                Cancel
              </button>
              <button onClick={runCancellationRequest} disabled={!canSubmit || submitting} className="flex-1 flex items-center justify-center">
                {submitting ? (<>
                    <span aria-hidden="true">{iconLabel("ri-loader-4-line animate-spin")}</span>
                    <span>Submitting...</span>
                  </>) : (<span>Submit Request</span>)}
              </button>
            </div>
          </div>)}
      </div>
    </div>);
}
