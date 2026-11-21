import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router';
import DashboardCard from '../../components/DashboardCard';
import { type colors } from '../../components/DashboardCard';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { fetchHostingDataById } from '../../redux/hostingSlice';
import { fetchAllTicketsByClient } from '../../redux/ticketsSlice';
import { fetchReferralsById } from '../../redux/additionalInfoSlice';
import { selectEnrichedClients } from '../../redux/selectors/clientsSelector';
import SEO from '../../components/SEO';
import { fetchClientById } from '../../redux/clientSlice';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTime } from '../../hooks/useClock';
export default function Dashboard() {
    const auth = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const hostingSlice = useSelector((state: RootState) => state.hosting);
    const ticketsSlice = useSelector((state: RootState) => state.tickets);
    const additionalInfoSlice = useSelector((state: RootState) => state.additionalInfo);
    const enrichedClients = useSelector(selectEnrichedClients);
    const client = enrichedClients.find(c => c.id === auth?.sub);
    const clientSlice = useSelector((state: RootState) => state.clients);
    const now = useCurrentTime();
    useEffect(() => {
        if (!ticketsSlice.clientHistoryFetched[auth?.sub || ""]) {
            dispatch(fetchAllTicketsByClient(auth?.sub || ""));
        }
        if (!additionalInfoSlice.clientAdditionalInfoFetched[auth?.sub || ""]) {
            dispatch(fetchReferralsById(auth?.sub || ""));
        }
        if (clientSlice.fetchStatus === "idle") {
            dispatch(fetchClientById(auth?.sub || ""));
        }
    }, [dispatch, auth?.sub, hostingSlice.clientHostingFetched, ticketsSlice.clientHistoryFetched, additionalInfoSlice.clientAdditionalInfoFetched]);
    useEffect(() => {
        if (!auth.sub)
            return;
        const refresh = () => { void dispatch(fetchHostingDataById(auth.sub!)); };
        refresh();
        window.addEventListener("focus", refresh);
        return () => window.removeEventListener("focus", refresh);
    }, [dispatch, auth.sub]);
    const dashboardCards = [
        {
            title: 'Referrals',
            value: additionalInfoSlice.referrals.length.toString(),
            subtitle: (additionalInfoSlice.referrals.length * 3).toString() + " months saved",
            icon: 'ri-gift-line',
            color: 'orange',
            isLoading: additionalInfoSlice.loadingFetch
        },
        {
            title: 'Hosting',
            value: (client?.hosting.length!) > 0 ? (client?.hosting[0].selfHosted ? "Self-Hosted" : now ? now.toLocaleString() : "Unknown") : "N/A",
            subtitle: client?.hosting[0]?.selfHosted ? "no upcoming renewal date" : Number(client?.hosting[0]?.endTime || 0) < (now || 0) ? "hosting coverage expired" : "hosting paid through",
            icon: 'ri-server-line',
            color: 'cyan',
            isLoading: hostingSlice.loadingFetch
        },
        {
            title: 'Open Tickets',
            value: (client?.tickets ?? []).reduce((count, ticket) => count + (ticket.status === "In Progress" ? 1 : 0), 0).toString(),
            subtitle: 'pending support requests',
            icon: 'ri-customer-service-2-line',
            color: 'red',
            isLoading: hostingSlice.loadingFetch
        }
    ];
    const quickActions = [
        {
            title: 'New Ticket',
            icon: 'ri-customer-service-2-line',
            color: 'bg-purple-600 hover:bg-purple-700',
            action: () => navigate('/support/tickets'),
            disabled: false
        },
        {
            title: 'Refer Friend',
            icon: 'ri-share-line',
            color: 'bg-orange-600 hover:bg-orange-700',
            disabled: false
        },
        {
            title: 'Update Website',
            icon: 'ri-refresh-line',
            color: 'bg-green-600 hover:bg-green-700',
            action: () => navigate(client?.websiteUrl || ""),
            disabled: !client?.websiteUrl
        },
        {
            title: 'View Analytics',
            icon: 'ri-line-chart-line',
            color: 'bg-blue-600 hover:bg-blue-700',
            disabled: false
        },
        {
            title: 'Billing & Payments',
            icon: 'ri-money-dollar-circle-line',
            color: 'bg-indigo-600 hover:bg-indigo-700',
            action: () => navigate('/dashboard/billing'),
            disabled: false
        }
    ];
    return (<DashboardLayout currentPage="dashboard" linkType='client'>
      <SEO title={"Bytewave Sites | Client Dashboard".replaceAll("Bytewave Sites", siteConfig.name)}/>    
      <div>
        
        <div>
          <h1>Welcome back!</h1>
          <p>Here's what's happening with your website and services.</p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (<DashboardCard key={index} title={card.title} value={card.value} subtitle={card.subtitle} icon={card.icon} color={card.color as colors} isLoading={card.isLoading}/>))}
        </div>

        
        <div>
          <h3>Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (<button key={index} onClick={action.action} className={uiClasses(`${action.color} text-white p-4 rounded-lg transition-colors text-center group ${!action.disabled ? 'hover:scale-105 transform transition-all duration-200' : ''} ${action.disabled ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`)} disabled={action.disabled}>
                <span aria-hidden="true">{iconLabel(`${action.icon} text-2xl mb-3 block group-hover:scale-110 transition-transform`)}</span>
                <span>{action.title}</span>
              </button>))}
          </div>
        </div>
      </div>
    </DashboardLayout>);
}
