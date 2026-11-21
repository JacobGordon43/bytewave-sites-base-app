import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { selectTicketById } from '../../redux/selectors/ticketSelector';
import { createMessage, fetchAllTicketsByClient, fetchTicketById, fetchTicketMessages, fetchTickets, resolveStatus, updateTicket } from '../../redux/ticketsSlice';
import logger from '../../utils/logger';
import type { CreateMessageData, MessageData } from '../../types/daoTypes';
import adminService from '../../services/adminService';
import SEO from '../../components/SEO';
import { useAuth } from '../../auth/AuthContext';
import { TicketDetailSkeleton } from '../../components/SkeletonLoader';
import { fetchClients } from '../../redux/clientSlice';
import { useCurrentTime } from '../../hooks/useClock';
export default function Ticket() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [newMessage, setNewMessage] = useState("");
    const dispatch = useDispatch<AppDispatch>();
    const ticketsSlice = useSelector((state: RootState) => state.tickets);
    const clientFetchStatus = useSelector((state: RootState) => state.clients.fetchStatus);
    const user: "client" | "support" = auth.groups.includes("Client") ? "client" : "support";
    const { ticketId } = useParams();
    const ticket = useSelector((state: RootState) => selectTicketById(state, ticketId!));
    const now = useCurrentTime();
    const lastCheckRef = useRef<number>(now);
    useEffect(() => {
        if (ticketsSlice.fetchStatus === "idle") {
            dispatch(fetchTickets());
        }
        else if (!ticket && ticketId) {
            dispatch(fetchTicketById(ticketId));
        }
    }, [ticketId, dispatch, ticket]);
    useEffect(() => {
        if (!ticketId || ticket?.status !== "In Progress")
            return;
        let disposed = false;
        let checking = false;
        const checkForNewMessages = async () => {
            if (disposed || checking || document.visibilityState !== "visible")
                return;
            checking = true;
            try {
                const metadata = await adminService.getMetaData("tickets", `ticketId_${ticketId}_metadata`);
                if (!metadata || disposed)
                    return;
                if (lastCheckRef.current && metadata.lastUpdated > lastCheckRef.current) {
                    await dispatch(fetchTicketMessages(ticketId)).unwrap();
                    lastCheckRef.current = metadata.lastUpdated;
                }
                if (metadata.status === "Resolved") {
                    dispatch(resolveStatus(ticketId));
                }
            }
            catch (err) {
                logger.error(err);
            }
            finally {
                checking = false;
            }
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible")
                void checkForNewMessages();
        };
        const intervalId = window.setInterval(() => {
            void checkForNewMessages();
        }, 60000);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            disposed = true;
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [ticketId, ticket?.status]);
    useEffect(() => {
        if (auth.status !== "authenticated")
            return;
        if (ticketsSlice.ids.length === 0) {
            if (auth.groups.includes("Bytewave-Admin") || auth.groups.includes("Support")) {
                logger.log("Fetching tickets");
                dispatch(fetchTickets());
            }
            else if (auth.groups.includes("Client") && auth.sub) {
                dispatch(fetchAllTicketsByClient(auth.sub));
            }
        }
    }, [auth.groups, auth.status, auth.sub, dispatch, ticketsSlice.ids.length]);
    useEffect(() => {
        const needsClientDirectory = auth.groups.includes("Bytewave-Admin") || auth.groups.includes("Support");
        if (needsClientDirectory && clientFetchStatus === "idle") {
            void dispatch(fetchClients());
        }
    }, [auth.groups, clientFetchStatus, dispatch]);
    useEffect(() => {
        if (ticketId) {
            logger.log("Getting tickets");
            dispatch(fetchTicketMessages(ticketId));
        }
    }, [dispatch, ticketId]);
    const handleSend = async () => {
        logger.log("Before Trim");
        if (!newMessage.trim())
            return;
        const metadata = await adminService.getMetaData("tickets", `ticketId_${ticket?.id}_metadata`);
        if (metadata != null) {
            logger.log("Meta data:", metadata.lastUpdated);
            if (lastCheckRef.current && metadata.lastUpdated > lastCheckRef.current) {
                logger.log("Getting fetchMessages");
                dispatch(fetchTicketMessages(ticket?.id!));
                lastCheckRef.current = Date.now();
            }
            if (metadata.status === "Resolved") {
                dispatch(resolveStatus(ticket?.id!));
            }
            else {
                const from = auth.groups.includes("Client") ? "client" : "support";
                const messageData: CreateMessageData = {
                    message: newMessage,
                    from,
                    chatId: ticket?.id!,
                    clientId: ticket?.createdById!
                };
                logger.log("MessageData chatId: " + messageData.chatId);
                await dispatch(createMessage(messageData)).unwrap();
                if (!ticketsSlice.error) {
                    setNewMessage("");
                }
            }
        }
    };
    const handleMarkResolved = (e: React.MouseEvent) => {
        e.preventDefault();
        const newTicket = structuredClone(ticket!);
        newTicket.status = "Resolved";
        dispatch(updateTicket({ originalTicket: ticket!, newTicket }));
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open':
                return 'bg-blue-600 text-blue-100';
            case 'In Progress':
                return 'bg-yellow-600 text-yellow-100';
            case 'Resolved':
                return 'bg-green-600 text-green-100';
            default:
                return 'bg-slate-600 text-slate-100';
        }
    };
    const formatDate = (dateNum: number) => {
        const date = new Date(dateNum);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    };
    if (ticketsSlice.loadingFetch) {
        return (<DashboardLayout currentPage='support' linkType={auth.groups.includes("Admin") ? "admin" : "client"}>
      <TicketDetailSkeleton />
    </DashboardLayout>);
    }
    if (!ticket) {
        return (<DashboardLayout currentPage="support" linkType={auth.groups.includes("Bytewave-Admin")
                ? "admin"
                : auth.groups.includes("Support")
                    ? "support"
                    : "client"}>
      <SEO title={"Bytewave Sites | Ticket".replaceAll("Bytewave Sites", siteConfig.name)}/>

      {ticketsSlice.loadingFetch ? (<p>Loading ticket...</p>) : (<div>
          <h1>Ticket not found</h1>
          <p>
            This ticket does not exist or you do not have access to it.
          </p>
          <button type="button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>)}
    </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="support" linkType={auth.groups.includes("Bytewave-Admin") ? "admin" : auth.groups.includes("Support") ? "support" : "client"}>
      
      <SEO title={"Bytewave Sites | Ticket".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)}>
              <span aria-hidden="true">{iconLabel("ri-arrow-left-line text-xl")}</span>
            </button>
            <div>
              <h1>Ticket {ticket?.id}</h1>
              <p>{ticket?.category}</p>
            </div>
          </div>
          
          {ticket?.status !== 'Resolved' && (<button onClick={(e) => handleMarkResolved(e)}>
              Mark as Resolved
            </button>)}
        </div>

        
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p>Status</p>
              <span className={uiClasses(`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(ticket.status)}`)}>
                {ticket?.status.replace('-', ' ')}
              </span>
            </div>
            
            <div>
              <p>Category</p>
              <p>{ticket.category}</p>
            </div>
            <div>
              <p>Created</p>
              <p>{formatDate(ticket.dateCreated)}</p>
            </div>
          </div>
        </div>

        
        <div className="flex flex-col h-96">
          <div className="flex-1 overflow-y-auto">
                    {[...(ticket?.description ? [{
                    id: ticket.id,
                    chatId: ticket.id,
                    message: ticket.description,
                    from: "client",
                    date: ticket.dateCreated
                }] as MessageData[] : []),
            ...(ticket?.messages ?? [])
        ].map((msg, index) => (<div key={index} className={uiClasses(`flex ${msg.from === user ? 'justify-end' : 'justify-start'}`)}>
                <div className={uiClasses(`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${msg.from === user
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-100'}`)}>
                  <p>{msg.message}</p>
                  
                </div>
              </div>))}
            
          </div>

          
          {ticket?.status !== 'Resolved' && (<div>
              <div className="flex">
                <input className="flex-1" type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => {
                if (e.key === "Enter" && !e.repeat && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void handleSend();
                }
            }} placeholder="Type your message..."/>
                <button onClick={handleSend} disabled={!newMessage.trim() || ticketsSlice.loadingSendMessage}>
                  Send
                </button>
              </div>
            </div>)}

          {ticket?.status === 'Resolved' && (<div>
              <div className="flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-check-line")}</span>
                <span>This ticket has been resolved</span>
              </div>
            </div>)}
        </div>
      </div>

      
      
    </DashboardLayout>);
}
