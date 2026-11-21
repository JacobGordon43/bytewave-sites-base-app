'use client';
import { iconLabel } from "../../utils/presentation";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../auth/AuthContext';
import { createTicket } from '../../redux/ticketsSlice';
import type { AppDispatch, RootState } from '../../redux/store';
interface Props {
    open: boolean;
    onClose: () => void;
}
const issueTypes = [
    'Website Down/Not Loading',
    'Email Issues',
    'Domain Problems',
    'Performance Issues',
    'SSL Certificate Issues',
    'Database Problems',
    'Billing Questions',
    'Other Technical Issue'
];
export default function ReportIssueModal({ open, onClose }: Props) {
    const auth = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const ticketSlice = useSelector((state: RootState) => state.tickets);
    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [ticketId, setTicketId] = useState<string | null>(null);
    if (!open)
        return null;
    const canSubmit = issueType !== '' && description.trim().length > 0;
    const handleClose = () => {
        setIssueType('');
        setDescription('');
        setTicketId(null);
        onClose();
    };
    const runIssueReport = async () => {
        const formData = new FormData();
        formData.append('category', issueType);
        formData.append('description', description.trim());
        const createdTicket = await dispatch(createTicket({ formData, userId: auth?.sub || '' })).unwrap();
        if (!createdTicket?.id) {
            throw new Error('Ticket not created.');
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
              Your issue report has been submitted. Our team will follow up shortly.
            </p>
            <Link to={`/support/tickets/${ticketId}`} className="inline-flex items-center">
              <span>View Ticket {ticketId}</span>
              <span aria-hidden="true">{iconLabel("ri-arrow-right-line")}</span>
            </Link>
            <button type="button" onClick={handleClose} className="block w-full">
              Close
            </button>
          </div>) : (<div>
            <div className="flex justify-between items-center">
              <h3>Report an Issue</h3>
              <button type="button" onClick={handleClose} aria-label="Close report issue modal" className="w-6 h-6 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
              </button>
            </div>

            <div>
              <div>
                <label htmlFor="issue-type" className="block">
                  Issue Type
                </label>
                <select className="w-full" id="issue-type" value={issueType} onChange={(event) => setIssueType(event.target.value)}>
                  <option value="">Select an issue type</option>
                  {issueTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                </select>
              </div>

              <div>
                <label htmlFor="issue-description" className="block">
                  Description
                </label>
                <textarea className="w-full" id="issue-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the issue in detail..." rows={4} maxLength={500}/>
                <p>{description.length}/500 characters</p>
              </div>
            </div>

            <div className="flex">
              <button className="flex-1" type="button" onClick={handleClose}>
                Cancel
              </button>
              <button type="button" onClick={runIssueReport} disabled={!canSubmit || ticketSlice.loadingCreate} className="flex-1 flex items-center justify-center">
                {ticketSlice.loadingCreate ? (<>
                    <span aria-hidden="true">{iconLabel("ri-loader-4-line animate-spin")}</span>
                    <span>Submitting...</span>
                  </>) : (<span>Submit Report</span>)}
              </button>
            </div>
          </div>)}
      </div>
    </div>);
}
