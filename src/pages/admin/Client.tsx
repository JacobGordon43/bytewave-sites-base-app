import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectClients, selectEnrichedClients } from "../../redux/selectors/clientsSelector";
import type { AppDispatch, RootState } from "../../redux/store";
import type { ClientData, HostingData } from "../../types/daoTypes";
import CreateHostingModal from "../../components/modals/CreateHostingModal";
import { clearHostingError, createHostingData, fetchHostingData, setHostingError, updateHostingData } from "../../redux/hostingSlice";
import CreateReferralModal from "../../components/modals/CreateReferralModal";
import { addRevenue, clearReferralError, createReferral } from "../../redux/additionalInfoSlice";
import CreatePaymentModal from "../../components/modals/CreatePaymentModal";
import { clearPaymentError, createPayment, fetchPaymentsById } from "../../redux/paymentsSlice";
import { fetchClients, updateClient } from "../../redux/clientSlice";
import SEO from "../../components/SEO";
import { fetchAllTicketsByClient } from "../../redux/ticketsSlice";
import FeedbackMessage from "../../components/FeedbackMessage";
import SubscriptionsPanel from "../../components/SubscriptionsPanel";
export default function Client({ readOnly = false }: {
    readOnly?: boolean;
}) {
    const { clientId } = useParams<{
        clientId: string;
    }>();
    const clients = useSelector(selectClients);
    const enrichedClients = useSelector(selectEnrichedClients);
    const enrichedClient = enrichedClients.find(c => c.id === clientId);
    const paymentRef = useRef<HTMLFormElement>(null);
    const hostingRef = useRef<HTMLFormElement>(null);
    const referralRef = useRef<HTMLFormElement>(null);
    const dispatch = useDispatch<AppDispatch>();
    const paymentSlice = useSelector((state: RootState) => state.payments);
    const hostingSlice = useSelector((state: RootState) => state.hosting);
    const additionalInfoSlice = useSelector((state: RootState) => state.additionalInfo);
    const clientSlice = useSelector((state: RootState) => state.clients);
    const [openHostingModal, setOpenHostingModal] = useState(false);
    const [openReferralModal, setOpenReferralModal] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [hostingSuccess, setHostingSuccess] = useState(false);
    const [hostingToDeactivate, setHostingToDeactivate] = useState<HostingData | null>(null);
    const [deactivatingHostingId, setDeactivatingHostingId] = useState<string | null>(null);
    const [clientContactConfirmed, setClientContactConfirmed] = useState(false);
    const [websiteShutdownConfirmed, setWebsiteShutdownConfirmed] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [, setPaymentSuccess] = useState(false);
    const [, setReferralSuccess] = useState(false);
    const [businessForm, setBusinessForm] = useState({
        websiteUrl: enrichedClient?.websiteUrl,
        businessEmail: enrichedClient?.businessEmail
    });
    const [editingBusiness, setEditingBusiness] = useState(false);
    useEffect(() => {
        const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => window.clearInterval(timer);
    }, []);
    useEffect(() => {
        if (clientSlice.fetchStatus === "idle") {
            dispatch(fetchClients());
        }
        if (hostingSlice.fetchStatus === "idle") {
            dispatch(fetchHostingData());
        }
    }, [clientSlice.fetchStatus, dispatch, hostingSlice.fetchStatus]);
    useEffect(() => {
        if (!clientId)
            return;
        void dispatch(fetchPaymentsById(clientId));
        void dispatch(fetchAllTicketsByClient(clientId));
    }, [clientId, dispatch]);
    const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBusinessForm({
            ...businessForm,
            [e.target.name]: e.target.value
        });
    };
    const handleSaveClientInfo = async () => {
        let newClientInfo = structuredClone(clients.find((client) => client.id === enrichedClient!.id));
        newClientInfo!.businessEmail = businessForm.businessEmail || "";
        newClientInfo!.websiteUrl = businessForm.websiteUrl || "";
        await dispatch(updateClient({ originalClient: enrichedClient!, newClient: newClientInfo! })).unwrap();
        if (!clientSlice.error) {
            setEditingBusiness(false);
        }
        else {
        }
    };
    const formatDate = (dateString: number) => {
        const date = new Date(parseInt(dateString.toString()));
        return date.toLocaleDateString();
    };
    const formatDateTime = (dateNum: number) => {
        const date = new Date(dateNum);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
            case 'Completed':
            case 'Complete':
                return 'bg-green-600 text-green-100';
            case 'Inactive':
            case 'Expired':
            case 'Not Started':
                return 'bg-slate-600 text-slate-100';
            case 'Past Due':
            case 'Failed':
                return 'bg-red-600 text-red-100';
            case 'In Progress':
            case 'Pending':
                return 'bg-yellow-600 text-yellow-100';
            case 'Open':
                return 'bg-blue-600 text-blue-100';
            case 'Resolved':
                return 'bg-green-600 text-green-100';
            default:
                return 'bg-slate-600 text-slate-100';
        }
    };
    const handleAddHostingSubmit = async (e: React.SubmitEvent, months: number, selfHosted: boolean) => {
        e.preventDefault();
        setHostingSuccess(false);
        dispatch(clearHostingError());
        try {
            if (!clientId || (!selfHosted && (!Number.isSafeInteger(months) || months <= 0)))
                throw new Error("Enter a positive whole number of months.");
            const formData = new FormData();
            formData.set("clientId", clientId!);
            formData.set("hosting", String(months));
            formData.set("selfHosted", String(selfHosted));
            const records = await dispatch(fetchHostingData()).unwrap();
            const latest = records.filter(record => record.clientId === clientId && !record.selfHosted).sort((a, b) => b.endTime - a.endTime)[0];
            if (selfHosted || !latest)
                await dispatch(createHostingData(formData)).unwrap();
            else {
                const newHosting: HostingData = { ...latest, status: "Active", endTime: Math.max(Date.now(), latest.endTime) + months * 30 * 86400000 };
                await dispatch(updateHostingData({ originalHosting: latest, newHosting })).unwrap();
            }
            setHostingSuccess(true);
            setOpenHostingModal(false);
        }
        catch (error) {
            dispatch(setHostingError(typeof error === "string" ? error : error instanceof Error ? error.message : "Unable to update hosting."));
        }
    };
    const handleDeactivateHosting = async (hostingData: HostingData) => {
        const endTime = Number(hostingData.endTime);
        dispatch(clearHostingError());
        if (!clientContactConfirmed || !websiteShutdownConfirmed) {
            dispatch(setHostingError("Confirm that the client was contacted and the website was shut off before deactivating hosting."));
            return;
        }
        if (!Number.isFinite(endTime)) {
            dispatch(setHostingError("This hosting record has an invalid end date and cannot be deactivated."));
            return;
        }
        if (endTime > Date.now()) {
            dispatch(setHostingError("Hosting is still active. It cannot be deactivated until after their hosting period."));
            return;
        }
        if (hostingData.status === "Expired") {
            setHostingToDeactivate(null);
            return;
        }
        try {
            setHostingSuccess(false);
            setDeactivatingHostingId(hostingData.id);
            await dispatch(updateHostingData({
                originalHosting: hostingData,
                newHosting: {
                    ...hostingData,
                    status: "Expired"
                }
            })).unwrap();
            setHostingSuccess(true);
            setHostingToDeactivate(null);
            setClientContactConfirmed(false);
            setWebsiteShutdownConfirmed(false);
        }
        catch (error) {
            dispatch(setHostingError(typeof error === "string"
                ? error
                : error instanceof Error
                    ? error.message
                    : "Hosting could not be deactivated."));
        }
        finally {
            setDeactivatingHostingId(null);
        }
    };
    const openHostingDeactivation = (hostingData: HostingData) => {
        setClientContactConfirmed(false);
        setWebsiteShutdownConfirmed(false);
        setHostingToDeactivate(hostingData);
    };
    const closeHostingDeactivation = () => {
        if (deactivatingHostingId !== null)
            return;
        setClientContactConfirmed(false);
        setWebsiteShutdownConfirmed(false);
        setHostingToDeactivate(null);
    };
    const handleReferralSubmit = async (referral: string) => {
        try {
            let results = await dispatch(createReferral({ referredBy: enrichedClient?.id!, referral })).unwrap();
            if (results) {
                let referredClient = enrichedClients.find((c) => c.id === referral);
                const newClient: ClientData = {
                    ...referredClient!,
                    referred: true
                };
                await dispatch(updateClient({ originalClient: referredClient!, newClient })).unwrap();
                setReferralSuccess(true);
                setOpenReferralModal(false);
            }
        }
        catch {
            setReferralSuccess(false);
        }
    };
    const handlePaymentSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (paymentRef.current) {
            const formData = new FormData(paymentRef.current);
            try {
                formData.set("clientId", clientId!);
                const result = await dispatch(createPayment(formData)).unwrap();
                dispatch(addRevenue(Math.round((Number(formData.get("amount")) || 0) * 100)));
                if (result) {
                    setPaymentSuccess(true);
                    setOpenPaymentModal(false);
                }
            }
            catch {
                setPaymentSuccess(false);
            }
        }
    };
    return (<DashboardLayout currentPage="clients" linkType={readOnly ? "support" : "admin"}>
      <SEO title={"Bytewave Sites | Clients".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to={readOnly ? "/support/clients" : "/admin/clients"}>
              <span aria-hidden="true">{iconLabel("ri-arrow-left-line text-xl")}</span>
            </Link>
            <div>
              <h1>{enrichedClient?.businessName}</h1>
              <p>Client Details - {enrichedClient?.id}</p>
            </div>
          </div>
          <span className={uiClasses(`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(enrichedClient?.status!)}`)}>
            {enrichedClient?.status}
          </span>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h3>Client Information</h3>
            <div>
              <div>
                <p>Contact Name</p>
                <p>{enrichedClient?.clientFirstName} {enrichedClient?.clientLastName}</p>
              </div>
              <div>
                <p>Email</p>
                <p>{enrichedClient?.email}</p>
              </div>
              <div>
                <p>Phone</p>
                <p>{enrichedClient?.phone}</p>
              </div>
              <div>
                <p>Join Date</p>
                <p>{formatDate(enrichedClient?.dateJoined!)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3>Quick Stats</h3>
            <div>
              <div className="flex justify-between">
                <span>Total Tickets</span>
                <span>{enrichedClient?.tickets.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Projects</span>
                <span>{enrichedClient?.projects.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Referrals</span>
                <span>{enrichedClient?.referrals.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Payments</span>
                <span>${enrichedClient?.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div>

            
            <div className="flex items-center justify-between">
              <h3>Business Information</h3>

              {!readOnly && <div className="flex items-center">
                {editingBusiness ? (<>
                    <button onClick={() => setEditingBusiness(false)} className="flex items-center">
                      <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
                      <span>Cancel</span>
                    </button>

                    <button onClick={handleSaveClientInfo} className="flex items-center">
                      <span aria-hidden="true">{iconLabel("ri-save-line")}</span>
                      <span>{clientSlice.loadingUpload ? "Saving..." : "Save"}</span>
                    </button>
                  </>) : (<button onClick={() => setEditingBusiness(true)} className="flex items-center">
                    <span aria-hidden="true">{iconLabel("ri-edit-line")}</span>
                    <span>Edit</span>
                  </button>)}
              </div>}
            </div>

            
            <div>

              <div>
                <p>Business Name</p>
                <p>{enrichedClient?.businessName}</p>
              </div>
    
              <div>
                <p>Business Website</p>

                {editingBusiness ? (<input className="w-full" name="websiteUrl" value={businessForm.websiteUrl ?? ""} onChange={handleBusinessChange}/>) : (<p>{enrichedClient?.websiteUrl}</p>)}
              </div>

              <div>
                <p>Business Email</p>

                {editingBusiness ? (<input className="w-full" name="businessEmail" value={businessForm.businessEmail ?? ""} onChange={handleBusinessChange}/>) : (<p>{enrichedClient?.businessEmail}</p>)}
              </div>

            </div>
          </div>
        </div>

        
        {!readOnly && (<SubscriptionsPanel admin clientId={clientId} onRefresh={() => { void dispatch(fetchHostingData()); if (clientId)
            void dispatch(fetchPaymentsById(clientId)); }}/>)}
        <div className="overflow-hidden">
          <div className="flex justify-between items-center">
            <h3>Hosting History</h3>
            {!readOnly && (<button onClick={() => setOpenHostingModal(true)} className="flex items-center">
                <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
                <span>Add Hosting</span>
              </button>)}
          </div>
          {hostingSlice.error && (<FeedbackMessage type="error" message={hostingSlice.error} onClose={() => dispatch(clearHostingError())}/>)}
          {hostingSuccess && !hostingSlice.error && (<FeedbackMessage type="success" message="Hosting was updated successfully." onClose={() => setHostingSuccess(false)}/>)}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  {!readOnly && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {enrichedClient?.hosting.map((hosting) => (<tr key={hosting.id}>
                    <td>{hosting.id}</td>
                    <td>{formatDate(hosting.startTime)}</td>
                    <td>{hosting.selfHosted ? "N/A" : formatDate(hosting.endTime)}</td>
                    <td>
                      <span className={uiClasses(`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(!hosting.selfHosted && Number(hosting.endTime) <= currentTime ? "Expired" : hosting.status)}`)}>
                        {!hosting.selfHosted && Number(hosting.endTime) <= currentTime ? "Expired" : hosting.status}
                      </span>
                    </td>
                    {!readOnly && <td>
                      {hosting.status === "Expired" ? (<span>Deactivated</span>) : (<button type="button" onClick={() => openHostingDeactivation(hosting)} disabled={Number(hosting.endTime) > currentTime || deactivatingHostingId === hosting.id} title={Number(hosting.endTime) > currentTime ? "Hosting can only be deactivated after its end date" : "Deactivate expired hosting"}>
                          {deactivatingHostingId === hosting.id ? "Deactivating..." : "Deactivate"}
                        </button>)}
                    </td>}
                  </tr>))}
                {enrichedClient?.hosting.length === 0 && (<tr>
                    <td colSpan={readOnly ? 4 : 5}>
                      No hosting history found for this client.
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {!readOnly && hostingToDeactivate && (<div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="deactivate-hosting-title">
              <div className="flex items-start">
                <div className="w-10 h-10 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-error-warning-line text-red-400 text-xl")}</span>
                </div>
                <div>
                  <h3 id="deactivate-hosting-title">Deactivate hosting?</h3>
                  <p>
                    This hosting period ended on {formatDate(hostingToDeactivate.endTime)}. Its status will be changed to Expired.
                  </p>
                </div>
              </div>
              <div>
                <label className="flex items-start gap-3">
                  <input className="h-4 w-4" type="checkbox" checked={clientContactConfirmed} onChange={(event) => setClientContactConfirmed(event.target.checked)} disabled={deactivatingHostingId !== null}/>
                  <span>I confirm the client has been contacted about their hosting expiration.</span>
                </label>
                <label className="flex items-start gap-3">
                  <input className="h-4 w-4" type="checkbox" checked={websiteShutdownConfirmed} onChange={(event) => setWebsiteShutdownConfirmed(event.target.checked)} disabled={deactivatingHostingId !== null}/>
                  <span>I confirm the client&apos;s website has been shut off.</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button className="disabled:opacity-50" type="button" onClick={closeHostingDeactivation} disabled={deactivatingHostingId !== null}>
                  Cancel
                </button>
                <button type="button" onClick={() => handleDeactivateHosting(hostingToDeactivate)} disabled={deactivatingHostingId !== null || !clientContactConfirmed || !websiteShutdownConfirmed}>
                  {deactivatingHostingId === hostingToDeactivate.id ? "Deactivating..." : "Deactivate Hosting"}
                </button>
              </div>
            </div>
          </div>)}

        
        <div className="overflow-hidden">
          <div className="flex justify-between items-center">
            <h3>Payment History</h3>
            {!readOnly && (<button onClick={() => setOpenPaymentModal(true)} className="flex items-center">
                <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
                <span>Add Payment</span>
              </button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Platform</th>
                </tr>
              </thead>
              <tbody>
                {enrichedClient?.payments.map((payment) => (<tr key={payment.id}>
                    <td>{formatDate(payment.date)}</td>
                    <td>
                      {payment.items?.map(({ item, quantity }) => `${item} × ${quantity}`).join(", ") || "—"}
                    </td>
                    <td>${payment.amount}</td>
                    <td>{payment.platform}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        
        <div className="overflow-hidden">
          <div>
            <h3>Support Tickets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {enrichedClient?.tickets.map((ticket) => (<tr key={ticket.id}>
                    <td>
                      <Link to={`/support/tickets/${ticket.id}`}>
                        {ticket.id}
                      </Link>
                    </td>
                    <td>{ticket.category}</td>

                    <td>
                      <span className={uiClasses(`px-2 py-1 rounded-full text-xs font-medium capitalize text-nowrap ${getStatusColor(ticket.status)}`)}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>{formatDateTime(ticket.dateCreated)}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        
        <div className="overflow-hidden">
          <div className="flex justify-between items-center">
            <h3>Referrals</h3>
            {!readOnly && (<button onClick={() => setOpenReferralModal(true)} className="flex items-center">
                <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
                <span>Add Referral</span>
              </button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Referred Client</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {enrichedClient?.referrals.length! > 0 ?
            enrichedClient?.referrals.map((referral) => (<tr key={referral.id}>
                    <td>{referral.referral}</td>
                    <td>{formatDate(referral.referredOn)}</td>
                    <td>
                      <span className={uiClasses(`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(referral.status)}`)}>
                        {referral.status}
                      </span>
                    </td>
                    
                  </tr>)) : (<tr>
                    <td className="w-full">No Client Data</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        
        

        
        {!readOnly && <CreateReferralModal referralError={additionalInfoSlice.referralError} currentClientId={enrichedClient?.id || ""} isLoading={additionalInfoSlice.loadingCreate} referralRef={referralRef} modalOpen={openReferralModal} clearReferralError={() => dispatch(clearReferralError())} onClose={() => setOpenReferralModal(false)} onSubmit={(referral) => handleReferralSubmit(referral)}/>}


        
        {!readOnly && <CreateHostingModal error={hostingSlice.error} isLoading={hostingSlice.loadingCreate} hostingRef={hostingRef} modalOpen={openHostingModal} closeError={() => dispatch(clearHostingError())} onClose={() => setOpenHostingModal(false)} onSubmit={(e, months, selfHosted) => handleAddHostingSubmit(e, months, selfHosted)}/>}
        
        {!readOnly && openPaymentModal && (<CreatePaymentModal error={paymentSlice.error} isLoading={paymentSlice.loadingUpload} paymentRef={paymentRef} modalOpen={openPaymentModal} closeError={() => dispatch(clearPaymentError())} onClose={() => setOpenPaymentModal(false)} onSubmit={(e) => handlePaymentSubmit(e)}/>)}
        
        
      </div>
    </DashboardLayout>);
}
