import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate } from 'react-router';
import DashboardCard from '../../components/DashboardCard';
import { type colors } from '../../components/DashboardCard';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { selectTicketsInProgress } from '../../redux/selectors/ticketSelector';
import SEO from '../../components/SEO';
import BusinessInfoForm from '../../components/forms/BusinessInfoForm';
import MaintenanceModeModal from '../../components/modals/MaintenanceModal';
import { fetchReferrals, fetchRevenue } from '../../redux/additionalInfoSlice';
export default function Dashboard() {
    const navigate = useNavigate();
    const businessInfo = useSelector((state: RootState) => state.businessInfo);
    const additionalInfoSlice = useSelector((state: RootState) => state.additionalInfo);
    const inProgressTickets = useSelector(selectTicketsInProgress);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const revenue = additionalInfoSlice.revenue;
    const dispatch = useDispatch<AppDispatch>();
    useEffect(() => {
        if (!revenue || revenue <= 0) {
            dispatch(fetchRevenue());
        }
        if (additionalInfoSlice.referralFetchStatus === "idle") {
            dispatch(fetchReferrals());
        }
    }, [dispatch]);
    const dashboardCards = [
        {
            title: 'Total Revenue',
            value: `$${((revenue || 0) / 100)?.toFixed(2)}`,
            subtitle: `between all ${siteConfig.name} clients`,
            icon: 'ri-bank-line',
            color: 'orange'
        },
        {
            title: 'Referrals',
            value: additionalInfoSlice.referrals.length.toString(),
            subtitle: 'clients were referred',
            icon: 'ri-user-add-line',
            color: 'cyan'
        },
        {
            title: 'Open Tickets',
            value: inProgressTickets.length.toString(),
            subtitle: 'pending support requests',
            icon: 'ri-customer-service-2-line',
            color: 'red'
        }
    ];
    const quickActions = [
        {
            title: 'New Ticket',
            icon: 'ri-customer-service-2-line',
            color: 'bg-purple-600 hover:bg-purple-700',
            action: () => navigate('/support/tickets')
        },
        {
            title: 'Maintenance Mode',
            icon: 'ri-tools-line',
            color: 'bg-yellow-600 hover:bg-yellow-700',
            action: () => setShowMaintenanceModal(true)
        },
        {
            title: 'Website Dashboard',
            icon: 'ri-refresh-line',
            color: 'bg-green-600 hover:bg-green-700',
            action: () => navigate(businessInfo.info!.websiteUrl || "")
        },
        {
            title: 'View Analytics',
            icon: 'ri-line-chart-line',
            color: 'bg-blue-600 hover:bg-blue-700',
        },
        {
            title: 'Manage Clients',
            icon: 'ri-team-line',
            color: 'bg-cyan-600 hover:bg-cyan-700',
            action: () => navigate('/admin/clients')
        },
        {
            title: 'Billing & Payments',
            icon: 'ri-money-dollar-circle-line',
            color: 'bg-indigo-600 hover:bg-indigo-700',
            action: () => navigate('/admin/billing')
        }
    ];
    return (<DashboardLayout currentPage="dashboard" linkType='admin'>
      <SEO title={"Bytewave Sites | Admin Dashboard".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div>
        
        <div>
          <h1>Welcome back!</h1>
          <p>Here's what's happening with your website and services.</p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (<DashboardCard key={index} title={card.title} value={card.value} subtitle={card.subtitle} icon={card.icon} color={card.color as colors} isLoading={false}/>))}
        </div>

        
        <div>
          <h3>Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (<button key={index} onClick={action.action} className={uiClasses(`${action.color} text-white p-4 rounded-lg transition-colors text-center group hover:scale-105 transform transition-all duration-200`)}>
                <span aria-hidden="true">{iconLabel(`${action.icon} text-2xl mb-3 block group-hover:scale-110 transition-transform`)}</span>
                <span>{action.title}</span>
              </button>))}
          </div>
        </div>
        <BusinessInfoForm status='operational'/>
      </div>
      <MaintenanceModeModal open={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)}/>
    </DashboardLayout>);
}
