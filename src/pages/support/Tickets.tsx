import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { selectTicketsByClient, selectTicketsInProgress } from '../../redux/selectors/ticketSelector';
import logger from '../../utils/logger';
import { clearTicketError, createTicket, fetchAllTicketsByClient, fetchTickets, fetchTicketsAfterDate } from '../../redux/ticketsSlice';
import adminService from '../../services/adminService';
import type { FormAndUserData } from '../../types/daoTypes';
import CreateTicketModal from '../../components/modals/CreateTicketModal';
import SEO from '../../components/SEO';
import { useAuth } from '../../auth/AuthContext';
import { fetchClients } from '../../redux/clientSlice';
import { useCurrentTime } from '../../hooks/useClock';
export default function Tickets() {
    const businessId = import.meta.env.VITE_APP_BUSINESS_ID!;
    const auth = useAuth();
    const [, setSuccess] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();
    const now = useCurrentTime();
    const ticketRef = useRef<HTMLFormElement>(null);
    const lastCheckRef = useRef<number>(now);
    const dispatch = useDispatch<AppDispatch>();
    const ticketsSlice = useSelector((state: RootState) => state.tickets);
    const clientFetchStatus = useSelector((state: RootState) => state.clients.fetchStatus);
    const allClientTickets = useSelector(selectTicketsByClient(auth?.sub || ""));
    const inProgressTickets = useSelector(selectTicketsInProgress);
    const ticketsToDisplay = auth?.groups?.includes("Client") ? allClientTickets : inProgressTickets;
    useEffect(() => {
        logger.log("User groups:", auth?.groups);
        if (ticketsSlice.fetchStatus === "idle") {
            if (auth?.groups.includes("Bytewave-Admin") || auth?.groups.includes("Support")) {
                logger.log("Fetching tickets");
                dispatch(fetchTickets());
            }
            else if (auth?.groups.includes("Client")) {
                dispatch(fetchAllTicketsByClient(auth?.sub || ""));
            }
        }
    }, [dispatch, auth, ticketsSlice.fetchStatus]);
    useEffect(() => {
        const needsClientDirectory = auth.groups.includes("Bytewave-Admin") || auth.groups.includes("Support");
        if (needsClientDirectory && clientFetchStatus === "idle") {
            void dispatch(fetchClients());
        }
    }, [auth.groups, clientFetchStatus, dispatch]);
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-600 text-blue-100';
            case 'In Progress':
                return 'bg-yellow-600 text-yellow-100';
            case 'Resolved':
                return 'bg-green-600 text-green-100';
            default:
                return 'bg-slate-600 text-slate-100';
        }
    };
    const handleFetchTickets = async () => {
        const metadata = await adminService.getMetaData("tickets", `businessId_${businessId}_metadata`);
        if (metadata) {
            if (lastCheckRef.current && metadata.lastUpdated > lastCheckRef.current) {
                logger.log("Getting fetchMessages");
                dispatch(fetchTicketsAfterDate(lastCheckRef.current));
                lastCheckRef.current = Date.now();
            }
            else {
                logger.log("All up to date!");
            }
        }
    };
    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (ticketRef.current) {
            setSuccess(false);
            const formData = new FormData(ticketRef.current);
            try {
                const ticketInfo: FormAndUserData = {
                    formData,
                    userId: auth?.sub || ""
                };
                let results = await dispatch(createTicket(ticketInfo)).unwrap();
                if (results) {
                    setSuccess(true);
                    setModalOpen(false);
                    navigate(`/support/tickets/${results.id}`);
                }
            }
            catch {
                setSuccess(false);
            }
        }
    };
    const handleModalClose = () => {
        setModalOpen(false);
        dispatch(clearTicketError());
    };
    return (<DashboardLayout currentPage="support" linkType={auth.groups.includes("Bytewave-Admin") ? "admin" : auth.groups.includes("Support") ? "support" : "client"}>
      <SEO title={"Bytewave Sites | Support".replaceAll("Bytewave Sites", siteConfig.name)}/>
      
      <div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1>Support Tickets</h1>
            <p>Manage your support requests and get help from our team</p>
          </div>
          {auth?.groups?.includes("Support") ? (<button onClick={() => handleFetchTickets()} disabled={ticketsSlice.loadingFetch} className="flex items-center">
                <span aria-hidden="true">{iconLabel(`ri-refresh-line ${ticketsSlice.loadingFetch ? 'animate-spin' : ''}`)}</span>
                <span>Refresh</span>
              </button>) : (<button onClick={() => setModalOpen(true)} className="flex items-center">
                <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
                <span>Create Ticket</span>
              </button>)}


        </div>

        
        <div className="overflow-hidden">
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
                {ticketsToDisplay.map((ticket) => (<tr key={ticket.id} onClick={() => navigate(ticket.id)}>
                    <td>
                      <span>{ticket.id}</span>
                    </td>
                    <td>
                      <span>{ticket.category}</span>
                    </td>
                    <td>
                      <span className={uiClasses(`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(ticket?.status)}`)}>
                        {ticket?.status.replace('-', ' ')}
                      </span>
                    </td>
                    
                    <td>
                      <span>{new Date(ticket?.dateCreated!).toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            })}</span>
                    </td>
                    
                  </tr>))}
              </tbody>
            </table>
          </div>

          {ticketsToDisplay.length === 0 && (<div>
              <span aria-hidden="true">{iconLabel("ri-ticket-line text-4xl text-slate-600 mb-4")}</span>
              <h3>No tickets found</h3>
              {auth?.groups?.includes("Support") ? (<p>No tickets in progress.</p>)
                :
                    (<p>You haven't created any support tickets yet.</p>)}
              
            </div>)}
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-ticket-line text-blue-400")}</span>
              </div>
              <div>
                <p>Total Tickets</p>
                <p>{ticketsToDisplay.length}</p>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-time-line text-blue-400")}</span>
              </div>
              <div>
                <p>In Progress</p>
                <p>{ticketsToDisplay.filter(t => t.status === 'In Progress').length}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-check-line text-green-400")}</span>
              </div>
              <div>
                <p>Resolved</p>
                <p>{ticketsToDisplay.filter(t => t.status === 'Resolved').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      <CreateTicketModal modalOpen={modalOpen} error={ticketsSlice.error} ticketRef={ticketRef} onClose={handleModalClose} onSubmit={handleTicketSubmit} closeError={() => dispatch(clearTicketError())} loadingUpload={ticketsSlice.loadingCreate}/>
    </DashboardLayout>);
}
