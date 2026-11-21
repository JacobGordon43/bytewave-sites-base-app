'use client';
import { uiClasses, iconLabel } from "../utils/presentation";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
interface DashboardLayoutProps {
    children: React.ReactNode;
    linkType: "admin" | "client" | "support";
    currentPage: string;
}
export default function DashboardLayout({ children, currentPage, linkType }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const handleLogout = () => {
        navigate('/logout');
    };
    const adminLinks = [
        { name: "Dashboard", to: "/admin/dashboard", icon: "ri-dashboard-line" },
        { name: 'Work Orders', to: '/admin/workOrders', icon: 'ri-file-list-3-line' },
        { name: 'Contact Submissions', to: '/admin/contactSubmissions', icon: 'ri-mail-line' },
        { name: "Manage About", to: "/admin/about", icon: "ri-information-line" },
        { name: "Service Catalog", to: "/admin/catalog", icon: "ri-shopping-bag-line" },
        { name: "Manage Services", to: "/admin/services", icon: "ri-service-line" },
        { name: "Manage FAQ", to: "/admin/faq", icon: "ri-question-answer-line" },
        { name: 'Portfolio', to: '/admin/portfolio', icon: 'ri-gallery-line' },
        { name: "Billing", to: "/admin/billing", icon: "ri-bill-line" },
        { name: "Clients", to: "/admin/clients", icon: "ri-team-line" },
        { name: "Support", to: "/support/tickets", icon: "ri-customer-service-2-line" }
    ];
    const clientLinks = [
        { name: "Dashboard", to: "/client/dashboard", icon: "ri-dashboard-line" },
        { name: "Billing", to: "/client/billing", icon: "ri-wallet-3-line" },
        { name: "Payments", to: "/client/payments", icon: "ri-bank-card-line" },
        { name: "Manage Account", to: "/client/manageAccount", icon: "ri-user-settings-line" },
        { name: "Support", to: "/support/tickets", icon: "ri-customer-service-2-line" }
    ];
    const supportLinks = [
        { name: "Clients", to: "/support/clients", icon: "ri-team-line" },
        { name: "Invoices", to: "/support/billing", icon: "ri-bill-line" },
        { name: "Support", to: "/support/tickets", icon: "ri-customer-service-2-line" },
    ];
    const navLinks = linkType === "admin"
        ? adminLinks
        : linkType === "support"
            ? supportLinks
            : clientLinks;
    return (<div className="h-screen flex overflow-hidden">
      
      <div className={uiClasses(`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-full sm:w-80 lg:w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-200 ease-in-out flex flex-col`)}>
        
        <div className="flex items-center justify-between">
          <h1>ByteWave Sites</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center">
            <span aria-hidden="true">{iconLabel("ri-close-line text-xl")}</span>
          </button>
        </div>

        
        <nav className="flex flex-col justify-between flex-1 overflow-y-auto">
          <ul>
            {navLinks.map((link) => (<li key={link.name}>
                <Link to={link.to} onClick={() => setIsSidebarOpen(false)} className={uiClasses(`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${currentPage === link.name.toLowerCase().replace(' ', '-')
            ? 'bg-blue-600 text-white'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`)}>
                  <span aria-hidden="true">{iconLabel(`${link.icon} text-lg`)}</span>
                  <span>{link.name}</span>
                </Link>
              </li>))}
          </ul>

          <div>
            <button onClick={handleLogout} className="w-full flex items-center">
              <span aria-hidden="true">{iconLabel("ri-logout-box-line")}</span>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      
      <div className="flex-1 flex flex-col min-w-0">
        
        <header>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-6 h-6 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-menu-line")}</span>
              </button>
              <h2>
                {currentPage.replace('-', ' ')}
              </h2>
            </div>
            
            <div className="flex items-center">
              <Link to="/">
                <span aria-hidden="true">{iconLabel("ri-home-line text-lg")}</span>
              </Link>
            </div>
          </div>
        </header>

        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      
      {isSidebarOpen && (<div className="lg:hidden fixed inset-0 z-40" onClick={() => setIsSidebarOpen(false)}/>)}
    </div>);
}
