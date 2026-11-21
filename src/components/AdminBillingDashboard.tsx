'use client';
import { uiClasses, iconLabel } from "../utils/presentation";
import { useRef, useState } from 'react';
import AdminBillingStats from './AdminBillingStats';
import AdminInvoiceTable from './tables/AdminInvoiceTable';
import CreatePaymentModal from './modals/CreatePaymentModal';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import { clearPaymentError, deletePaymentData, updatePayment } from '../redux/paymentsSlice';
import { selectEnrichedPayments } from '../redux/selectors/paymentsSelectors';
import type { PaymentData } from '../types/daoTypes';
import FeedbackMessage from './FeedbackMessage';
export default function AdminBillingDashboard({ readOnly = false }: {
    readOnly?: boolean;
}) {
    const [showCreate, setShowCreate] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const paymentSlice = useSelector((state: RootState) => state.payments);
    const paymentRef = useRef<HTMLFormElement>(null);
    const dispatch = useDispatch<AppDispatch>();
    const invoices = useSelector(selectEnrichedPayments);
    const handleCreate = (e: React.SubmitEvent) => {
        e.preventDefault();
    };
    const handleStatusChange = async (id: string, newStatus: PaymentData["status"]) => {
        const originalPayment = invoices.find((payment) => payment.paymentData.id === id)?.paymentData;
        if (!originalPayment)
            return;
        const newPayment: PaymentData = { ...originalPayment, status: newStatus };
        try {
            if (originalPayment.platform === "Stripe") {
            }
            await dispatch(updatePayment({ originalPayment, newPayment })).unwrap();
            setSuccessMsg(`Invoice ${id} marked as ${newStatus}.`);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSuccessMsg('');
            }, 3000);
        }
        catch {
            setSuccess(false);
            setSuccessMsg('');
        }
    };
    const handleDelete = async (paymentData: PaymentData) => {
        try {
            await dispatch(deletePaymentData(paymentData)).unwrap();
            setSuccessMsg(`Invoice ${paymentData.id} deleted.`);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSuccessMsg('');
            }, 3000);
        }
        catch (error) {
            setSuccess(false);
            setSuccessMsg('');
            throw error;
        }
    };
    const filtered = invoices.filter(inv => {
        const matchStatus = filterStatus === 'All' || inv.paymentData.status === filterStatus.toLowerCase();
        const matchSearch = inv.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.paymentData.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
    });
    return (<div>
      {success && (<FeedbackMessage type="success" message={successMsg} onClose={() => {
                setSuccess(false);
                setSuccessMsg('');
            }}/>)}
      {paymentSlice.error && (<FeedbackMessage type="error" message={paymentSlice.error} onClose={() => dispatch(clearPaymentError())}/>)}

      <AdminBillingStats invoices={invoices}/>

      <div className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3>All Invoices</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span aria-hidden="true">{iconLabel("ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm")}</span>
              <input className="w-56" type="text" placeholder="Search client or invoice..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
            </div>
            <StatusFilter value={filterStatus} onChange={setFilterStatus}/>
            {!readOnly && (<button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
                <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
                New Invoice
              </button>)}
          </div>
        </div>

        <AdminInvoiceTable invoices={filtered} onStatusChange={handleStatusChange} onDelete={handleDelete} loadingDelete={paymentSlice.loadingDelete} readOnly={readOnly}/>
      </div>

      {!readOnly && showCreate && (<CreatePaymentModal onClose={() => setShowCreate(false)} error="" onSubmit={(e) => handleCreate(e)} paymentRef={paymentRef} closeError={() => dispatch(clearPaymentError())} modalOpen={showCreate} isLoading={false}/>)}
    </div>);
}
function StatusFilter({ value, onChange, }: {
    value: string;
    onChange: (v: string) => void;
}) {
    const statuses = ['All', 'Paid', 'Pending', 'Overdue'];
    return (<div className="flex items-center gap-1">
      {statuses?.map(s => (<button key={s} onClick={() => onChange(s)} className={uiClasses(`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${value === s ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`)}>
          {s}
        </button>))}
    </div>);
}
