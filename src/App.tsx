import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import RequireAuth from "./wrappers/RequireAuth";
import { usePageTracking } from './hooks/usePageTracking';
import usePlatformStatus from "./hooks/usePlatformStatus";
import { useBusinessInfo } from "./hooks/useBusinessInfo";
import { useAbout } from "./hooks/useAbout";
import { useFAQ } from "./hooks/useFAQ";
import { usePortfolio } from "./hooks/usePortfolio";
import { useServices } from "./hooks/useServices";
import { ScrollToTop } from "./components/ScrollToTop";

const Home = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Logout = lazy(() => import("./pages/Logout"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));

const Dashboard = lazy(() => import("./pages/client/Dashboard"));
const ClientBilling = lazy(() => import("./pages/client/ClientBilling"));
const Payments = lazy(() => import("./pages/client/Payments"));
const PaymentCheckout = lazy(() => import("./pages/client/PaymentCheckout"));
const ManageAccount = lazy(() => import("./pages/client/ManageAccount"));
const InvoiceDetail = lazy(() => import("./pages/invoice/Invoice"));

const Tickets = lazy(() => import("./pages/support/Tickets"));
const Ticket = lazy(() => import("./pages/support/Ticket"));

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const ContactSubmissionsPage = lazy(() => import("./pages/admin/ContactSubmissions"));
const AboutManager = lazy(() => import("./pages/admin/AboutManager"));
const ServicesManager = lazy(() => import("./pages/admin/ServicesManager"));
const ServiceCatalog = lazy(() => import("./pages/admin/ServiceCatalog"));
const FAQManager = lazy(() => import("./pages/admin/FAQManager"));
const WorkOrderManager = lazy(() => import("./pages/admin/WorkOrderManager"));
const PortfolioManager = lazy(() => import("./pages/admin/PortfolioManager"));
const Clients = lazy(() => import("./pages/admin/Clients"));
const Client = lazy(() => import("./pages/admin/Client"));

const InfrastructureMaintenance = lazy(() => import("./pages/maintenance/InfrastructureMaintenance"));
const SiteMaintenance = lazy(() => import("./pages/maintenance/SiteMaintenance"));


function App() {
  const {status, loading} = usePlatformStatus();
  const { slice: businessSlice } = useBusinessInfo();
  useServices();
  useAbout();
  useFAQ();
  usePortfolio();
  usePageTracking();

  if(loading){
    return null;
  }

  if(status === "infrastructure-maintenance" ||businessSlice.info?.siteMaintenance){
    return(
      <>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>
          {/* Admin-only paths */}
          <Route element={<RequireAuth allowedRoles={["Bytewave-Admin"]} />}>
            <Route path='/admin/dashboard' element={<AdminDashboard />} />
            <Route path="/admin/contactSubmissions" element={<ContactSubmissionsPage />} />
            <Route path='/admin/about' element={<AboutManager />} />
            <Route path='/admin/services' element={<ServicesManager />} />
        <Route path='/admin/catalog' element={<ServiceCatalog />} />
            <Route path='/admin/faq' element={<FAQManager />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/admin/billing/invoice/:invoiceId" element={<InvoiceDetail />} />
            <Route path='/admin/workOrders' element={<WorkOrderManager />} />
            <Route path='/admin/portfolio' element={<PortfolioManager />} />
            {/* <Route path='/admin/projects' element={<CurrentProjects />} /> */}
            <Route path='/admin/clients' element={<Clients />} />
            <Route path='/admin/clients/:clientId' element={<Client />} />
          </Route>

          {/* Ticket paths shared by Bytewave administrators, support staff, and clients. */}
          <Route element={<RequireAuth allowedRoles={["Bytewave-Admin", "Support", "Client"]} />}>
            <Route path='/support/tickets' element={<Tickets />} />
            <Route path='/support/tickets/:ticketId' element={<Ticket />} />
            <Route path='/support/tickets/:ticketId/:clientId' element={<Ticket />} />
          </Route>
          <Route element={<RequireAuth allowedRoles={["Support"]} />}>
            <Route path='/support/clients' element={<Clients readOnly />} />
            <Route path='/support/clients/:clientId' element={<Client readOnly />} />
            <Route path='/support/billing' element={<AdminBilling readOnly />} />
            <Route path='/support/billing/invoice/:invoiceId' element={<InvoiceDetail />} />
          </Route>
          <Route path='/login' element={<Login />} />
          <Route path="/login/updatepassword" element={<UpdatePassword />} />
          <Route path='/logout' element={<Logout />} />
          <Route path="*" element={status === "infrastructure-maintenance" ? <InfrastructureMaintenance /> : <SiteMaintenance />}/>
          </Routes>
        </Suspense>
      </>
    )
  }

  return (
  <>
    <ScrollToTop />
    <Suspense fallback={null}>
      <Routes>
      {/* Base website paths */}
      <Route path='/' element={<Home />} />
      <Route path='/services' element={<Services />} />
      <Route path='/about' element={<About />} />
      <Route path='/portfolio' element={<Portfolio />} />
      <Route path='/contact' element={<Contact />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path='/login' element={<Login />} />
      <Route path="/login/updatepassword" element={<UpdatePassword />} />
      <Route path='/logout' element={<Logout />} />

      {/* Auth-related paths (not protected) */}
      {/* <Route path='/login/updatepassword' element={<UpdatePassword />} /> */}
      <Route path='/client/login/forgotpassword' element={<ForgotPassword />} />

      {/* Client-only paths */}
      <Route element={<RequireAuth allowedRoles={["Client"]} />}>
        {/* <Route path='/client/verify-email' element={<VerifyEmail />} /> */}
        <Route path='/client/dashboard' element={<Dashboard />} />
        <Route path='/client/billing' element={<ClientBilling />} />
        <Route path="/client/billing/invoice/:invoiceId" element={<InvoiceDetail />} />
        <Route path="/client/payments" element={<Payments />} />
        <Route path="/client/payments/:id" element={<PaymentCheckout />} />

        {/* <Route path='/client/payments' element={<Payment />} /> */}
        {/* <Route path='/client/payments/checkout' element={<Checkout />} /> */}
        <Route path='/client/manageAccount' element={<ManageAccount />} />
        <Route path='/client/support' element={<Tickets />} />
        <Route path='/client/support/:ticketId' element={<Ticket />} />
      </Route>

      {/* Admin-only paths */}
      <Route element={<RequireAuth allowedRoles={["Bytewave-Admin"]} />}>
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
        <Route path='/admin/billing' element={<AdminBilling />} />
        <Route path="/admin/contactSubmissions" element={<ContactSubmissionsPage />} />
        <Route path='/admin/about' element={<AboutManager />} />
        <Route path='/admin/services' element={<ServicesManager />} />
        <Route path='/admin/catalog' element={<ServiceCatalog />} />
        <Route path='/admin/faq' element={<FAQManager />} />
        <Route path='/admin/workOrders' element={<WorkOrderManager />} />
        <Route path='/admin/portfolio' element={<PortfolioManager />} />
        <Route path="/admin/billing/invoice/:invoiceId" element={<InvoiceDetail />} />
        {/* <Route path='/admin/projects' element={<CurrentProjects />} /> */}
        <Route path='/admin/clients' element={<Clients />} />
        <Route path='/admin/clients/:clientId' element={<Client />} />
      </Route>

      {/* Ticket paths shared by Bytewave administrators, support staff, and clients. */}
      <Route element={<RequireAuth allowedRoles={["Bytewave-Admin", "Support", "Client"]} />}>
        <Route path='/support/tickets' element={<Tickets />} />
        <Route path='/support/tickets/:ticketId' element={<Ticket />} />
        <Route path='/support/tickets/:ticketId/:clientId' element={<Ticket />} />
      </Route>
      <Route element={<RequireAuth allowedRoles={["Support"]} />}>
        <Route path='/support/clients' element={<Clients readOnly />} />
        <Route path='/support/clients/:clientId' element={<Client readOnly />} />
        <Route path='/support/billing' element={<AdminBilling readOnly />} />
        <Route path='/support/billing/invoice/:invoiceId' element={<InvoiceDetail />} />
      </Route>
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
  )

}

export default App;
