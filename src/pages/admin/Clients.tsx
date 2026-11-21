import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectEnrichedClients } from "../../redux/selectors/clientsSelector";
import CreateClientModal from "../../components/modals/CreateClientModal";
import type { AppDispatch, RootState } from "../../redux/store";
import { createClient, fetchClients } from "../../redux/clientSlice";
import logger from "../../utils/logger";
import SEO from "../../components/SEO";
import { ClientsSkeleton } from "../../components/SkeletonLoader";
import { fetchHostingData } from "../../redux/hostingSlice";
export default function Clients({ readOnly = false }: {
    readOnly?: boolean;
}) {
    const navigate = useNavigate();
    const [showClientModal, setShowClientModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<HTMLFormElement | null>(null);
    const enrichedClients = useSelector(selectEnrichedClients);
    const dispatch = useDispatch<AppDispatch>();
    const clientSlice = useSelector((state: RootState) => state.clients);
    const hostingSlice = useSelector((state: RootState) => state.hosting);
    useEffect(() => {
        if (clientSlice.fetchStatus === "idle") {
            dispatch(fetchClients());
        }
        if (hostingSlice.fetchStatus === "idle") {
            dispatch(fetchHostingData());
        }
    }, [dispatch, clientSlice.fetchStatus]);
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-600 text-green-100';
            case 'Inactive':
                return 'bg-slate-600 text-slate-100';
            case 'Past Due':
                return 'bg-red-600 text-red-100';
            default:
                return 'bg-slate-600 text-slate-100';
        }
    };
    const calculateStatus = (client: typeof enrichedClients[0]) => {
        if (client.hosting.length > 0) {
            const currentHosting = client.hosting[0];
            if (currentHosting.status === "Expired") {
                return "Inactive";
            }
            const currentTime = new Date().getTime();
            if (currentHosting.endTime < currentTime) {
                return "Past Due";
            }
            const activeHosting = client.hosting.find(h => h.status === "Active");
            if (activeHosting) {
                return "Active";
            }
        }
        return "Unknown";
    };
    const formatDate = (dateNum: number) => {
        const date = new Date(dateNum);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (clientRef.current) {
            setSuccess(false);
            const formData = new FormData(clientRef.current);
            try {
                let results = await dispatch(createClient(formData)).unwrap();
                logger.info(results);
                if (results) {
                    setError(null);
                    setSuccess(true);
                    setShowClientModal(false);
                    setIsLoading(false);
                }
            }
            catch (err) {
                setSuccess(false);
                if (err instanceof Error) {
                    setError(`There was an issue creating the client: ${err.message}`);
                }
                else if (typeof err === "string") {
                    setError(err);
                }
                else {
                    setError("There was an unknown error creating the user.");
                }
                setIsLoading(false);
            }
        }
    };
    if (clientSlice.loadingFetch) {
        return (<DashboardLayout currentPage="clients" linkType={readOnly ? "support" : "admin"}>
        <SEO title={"Bytewave Sites | Clients".replaceAll("Bytewave Sites", siteConfig.name)}/>
        <ClientsSkeleton />
      </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="clients" linkType={readOnly ? "support" : "admin"}>
      <SEO title={"Bytewave Sites | Clients".replaceAll("Bytewave Sites", siteConfig.name)}/>

      <div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1>Clients</h1>
            <p>Manage and view client information</p>
          </div>
          {!readOnly && (<button onClick={() => setShowClientModal(true)} className="flex items-center">
              <span aria-hidden="true">{iconLabel(`ri-user-add-line`)}</span>
              <span>Create Client</span>
            </button>)}
        </div>

        
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Business Name</th>
                  <th>Contact Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Tickets</th>
                  <th>Projects</th>
                </tr>
              </thead>
              <tbody>
                {enrichedClients.map((client) => (<tr key={client.id} onClick={() => navigate(`${readOnly ? "/support/clients" : "/admin/clients"}/${client.id}`)}>
                    <td>
                      <span>{client.id}</span>
                    </td>
                    <td>
                      <span>{client.businessName}</span>
                    </td>
                    <td>
                      <span>{client.clientFirstName} {client.clientLastName}</span>
                    </td>
                    <td>
                      <span>{client.email}</span>
                    </td>
                    <td>
                      <span className={uiClasses(`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(calculateStatus(client))}`)}>
                        {calculateStatus(client)}
                      </span>
                    </td>
                    <td>
                      <span>{formatDate(client.dateJoined)}</span>
                    </td>
                    
                    <td>
                      <span>{client.tickets.length}</span>
                    </td>
                    <td>
                      <span>{client.projects.length}</span>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          {enrichedClients.length === 0 && (<div>
              <span aria-hidden="true">{iconLabel("ri-team-line text-4xl text-slate-600 mb-4")}</span>
              <h3>No clients found</h3>
              <p>No clients have been added yet.</p>
            </div>)}
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-team-line text-blue-400")}</span>
              </div>
              <div>
                <p>Total Clients</p>
                <p>{enrichedClients.length}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-check-line text-green-400")}</span>
              </div>
              <div>
                <p>Active</p>
                <p>{enrichedClients.reduce((acc, c) => acc + (calculateStatus(c) === "Active" ? 1 : 0), 0)}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-pause-line text-slate-400")}</span>
              </div>
              <div>
                <p>Inactive</p>
                <p>{enrichedClients.reduce((acc, c) => acc + (calculateStatus(c) === "Inactive" ? 1 : 0), 0)}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-close-line text-red-400")}</span>
              </div>
              <div>
                <p>Past Due</p>
                <p>{enrichedClients.reduce((acc, c) => acc + (calculateStatus(c) === "Past Due" ? 1 : 0), 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {!readOnly && (<CreateClientModal isLoading={isLoading} clientRef={clientRef} modalOpen={showClientModal} error={error} onClose={() => setShowClientModal(false)} onSubmit={(e) => handleCreateClient(e)} closeError={() => setError(null)}/>)}
    </DashboardLayout>);
}
