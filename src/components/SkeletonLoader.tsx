import { uiClasses, iconLabel } from "../utils/presentation";
function Pulse({ className }: {
    className?: string;
}) {
    return <div className={uiClasses(`animate-pulse bg-slate-700 rounded ${className || ''}`)}/>;
}
export function AboutManagerSkeleton() {
    return (<div>
      <div className="flex items-center justify-between">
        <div>
          <h1>About Page Management</h1>
          <p>Add, edit, and manage your About page sections</p>
        </div>
        <button className="flex items-center gap-2 opacity-50">
          <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
          Add Section
        </button>
      </div>
      {[1, 2, 3].map((i) => (<div className="overflow-hidden" key={i}>
          <div>
            <div>
              <Pulse className="h-7 w-48" />
              <Pulse className="h-5 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((j) => (<div key={j}>
                  <Pulse className="w-14 h-14" />
                  <Pulse className="h-6 w-36" />
                  <Pulse className="h-4 w-full" />
                  <Pulse className="h-4 w-4/5" />
                </div>))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4">
              <Pulse className="h-4 w-20" />
              <Pulse className="h-4 w-16" />
              <Pulse className="h-4 w-24" />
            </div>
          </div>
        </div>))}
    </div>);
}
export function AdminBillingSkeleton() {
    const cards = [
        { icon: 'ri-money-dollar-circle-line', color: 'bg-blue-600', label: 'Total Invoiced' },
        { icon: 'ri-checkbox-circle-line', color: 'bg-green-600', label: 'Collected' },
        { icon: 'ri-time-line', color: 'bg-yellow-600', label: 'Awaiting Payment' },
        { icon: 'ri-error-warning-line', color: 'bg-red-600', label: 'Overdue' },
    ];
    return (<div>
      <div>
        <h1>Admin Billing</h1>
        <p>Manage client invoices and billing overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (<div key={i}>
            <div className={uiClasses(`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`)}>
              <span aria-hidden="true">{iconLabel(`${card.icon} text-white text-xl`)}</span>
            </div>
            <p>{card.label}</p>
            <Pulse className="h-7 w-24" />
          </div>))}
      </div>
      <div className="overflow-hidden">
        <div className="flex items-center justify-between">
          <h3>All Invoices</h3>
          <div className="flex items-center gap-3">
            <Pulse className="h-9 w-56" />
            <Pulse className="h-9 w-48" />
            <Pulse className="h-9 w-32" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Invoice', 'Client', 'Description', 'Amount', 'Date', 'Due', 'Status', 'Actions'].map((h) => (<th key={h}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (<tr key={i}>
                  <td><Pulse className="h-4 w-28" /></td>
                  <td><Pulse className="h-4 w-24" /></td>
                  <td><Pulse className="h-4 w-40" /></td>
                  <td><Pulse className="h-4 w-16" /></td>
                  <td><Pulse className="h-4 w-20" /></td>
                  <td><Pulse className="h-4 w-20" /></td>
                  <td><Pulse className="h-6 w-16" /></td>
                  <td><Pulse className="h-7 w-20" /></td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
export function FAQManagerSkeleton() {
    return (<div>
      <div className="flex items-center justify-between">
        <div>
          <h1>FAQ Management</h1>
          <p>Add, edit, and manage your FAQ sections and questions</p>
        </div>
        <button className="flex items-center gap-2 opacity-50">
          <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
          Add Section
        </button>
      </div>
      {[1, 2, 3].map((i) => (<div className="overflow-hidden" key={i}>
          <div className="flex items-center gap-4">
            <Pulse className="w-12 h-12" />
            <div>
              <Pulse className="h-6 w-44" />
              <Pulse className="h-4 w-24" />
            </div>
          </div>
          <div>
            {Array.from({ length: 3 + i }).map((_, j) => (<div key={j}>
                <div className="flex items-start gap-3">
                  <Pulse className="w-6 h-5" />
                  <div className="flex-1">
                    <Pulse className="h-4 w-3/4" />
                    <Pulse className="h-3 w-full" />
                  </div>
                </div>
              </div>))}
          </div>
        </div>))}
    </div>);
}
export function ServicesManagerSkeleton() {
    return (<div>
      <div className="flex items-center justify-between">
        <div>
          <h1>Services Management</h1>
          <p>Add, edit, and manage your service offerings</p>
        </div>
        <button className="flex items-center gap-2 opacity-50">
          <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
          Add Service
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (<div key={i}>
            <div className="flex items-center">
              <Pulse className="w-14 h-14" />
              <div>
                <Pulse className="h-6 w-40" />
                <Pulse className="h-4 w-28" />
              </div>
            </div>
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-5/6" />
            <div>
              <div>
                <Pulse className="h-4 w-32" />
                {[1, 2, 3, 4].map((j) => (<div key={j} className="flex items-center">
                    <Pulse className="w-4 h-4" />
                    <Pulse className="h-3 w-40" />
                  </div>))}
              </div>
              <div>
                <Pulse className="h-4 w-28" />
                {[1, 2].map((j) => (<Pulse className="h-3 w-48" key={j}/>))}
              </div>
            </div>
          </div>))}
      </div>
    </div>);
}
export function WorkOrdersSkeleton() {
    const statCards = [
        { icon: 'ri-folder-line', color: 'bg-purple-600/20', iconColor: 'text-purple-400', label: 'Work Orders' },
        { icon: 'ri-file-list-3-line', color: 'bg-blue-600/20', iconColor: 'text-blue-400', label: 'Total Tasks' },
        { icon: 'ri-time-line', color: 'bg-slate-600/20', iconColor: 'text-slate-400', label: 'Not Started' },
        { icon: 'ri-loader-4-line', color: 'bg-yellow-600/20', iconColor: 'text-yellow-400', label: 'In Progress' },
        { icon: 'ri-check-line', color: 'bg-green-600/20', iconColor: 'text-green-400', label: 'Completed' },
    ];
    return (<div>
      <div className="flex justify-between items-center">
        <div>
          <h1>Work Orders</h1>
          <p>Manage and track all work orders and their tasks</p>
        </div>
        <button className="flex items-center opacity-50">
          <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
          <span>New Work Order</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        {statCards.map((card, i) => (<div className="flex-1 min-w-[160px]" key={i}>
            <div className="flex items-center">
              <div className={uiClasses(`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`)}>
                <span aria-hidden="true">{iconLabel(`${card.icon} ${card.iconColor}`)}</span>
              </div>
              <div>
                <p>{card.label}</p>
                <Pulse className="h-6 w-8" />
              </div>
            </div>
          </div>))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (<div className="overflow-hidden" key={i}>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <Pulse className="h-4 w-16" />
                    <Pulse className="h-3 w-14" />
                  </div>
                  <Pulse className="h-5 w-36" />
                </div>
                <Pulse className="h-6 w-16" />
              </div>
              <div className="flex items-center">
                <Pulse className="h-3 w-32" />
                <Pulse className="h-3 w-28" />
              </div>
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-3/4" />
              <div>
                <div className="flex items-center justify-between">
                  <Pulse className="h-3 w-16" />
                  <Pulse className="h-3 w-8" />
                </div>
                <Pulse className="h-2 w-full" />
              </div>
              <Pulse className="h-3 w-20" />
              <div>
                {[1, 2, 3].map((j) => (<div key={j} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Pulse className="w-4 h-4" />
                      <Pulse className="h-4 w-32" />
                    </div>
                    <Pulse className="h-6 w-20" />
                  </div>))}
              </div>
            </div>
            <div className="flex justify-end">
              <Pulse className="h-9 w-20" />
            </div>
          </div>))}
      </div>
    </div>);
}
export function PortfolioManagerSkeleton() {
    return (<div>
      <div className="flex items-center justify-between">
        <div>
          <h1>Portfolio Management</h1>
          <p>Add, edit, and manage your portfolio projects</p>
        </div>
        <button className="flex items-center gap-2 opacity-50">
          <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
          Add Project
        </button>
      </div>
      <div className="flex items-center justify-between">
        <Pulse className="h-5 w-24" />
        <Pulse className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (<div className="overflow-hidden" key={i}>
            <Pulse className="w-full" />
            <div>
              <Pulse className="h-5 w-3/4" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-2/3" />
              <Pulse className="h-3 w-1/2" />
            </div>
          </div>))}
      </div>
    </div>);
}
export function BillingSkeleton() {
    const cards = [
        { icon: 'ri-money-dollar-circle-line', color: 'bg-blue-600', label: 'Current Plan' },
        { icon: 'ri-calendar-line', color: 'bg-green-600', label: 'Next Payment' },
        { icon: 'ri-gift-line', color: 'bg-purple-600', label: 'Referral Savings' },
    ];
    return (<div>
      <div>
        <h1>Billing</h1>
        <p>Manage your subscription and billing history</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (<div key={i}>
            <div className="flex items-center justify-between">
              <div className={uiClasses(`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`)}>
                <span aria-hidden="true">{iconLabel(`${card.icon} text-white text-xl`)}</span>
              </div>
            </div>
            <p>{card.label}</p>
            <Pulse className="h-7 w-32" />
            <Pulse className="h-4 w-20" />
          </div>))}
      </div>
      <div>
        <h3>Payment Method</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Pulse className="w-12 h-12" />
            <div>
              <Pulse className="h-5 w-40" />
              <Pulse className="h-4 w-24" />
            </div>
          </div>
          <Pulse className="h-4 w-12" />
        </div>
      </div>
      <div className="overflow-hidden">
        <div>
          <h3>Billing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Date', 'Description', 'Amount', 'Status', 'Invoice'].map((h) => (<th key={h}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (<tr key={i}>
                  <td><Pulse className="h-4 w-20" /></td>
                  <td><Pulse className="h-4 w-48" /></td>
                  <td><Pulse className="h-4 w-16" /></td>
                  <td><Pulse className="h-6 w-14" /></td>
                  <td><Pulse className="h-4 w-32" /></td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3>Usage This Month</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (<div key={i}>
              <div className="flex justify-between items-center">
                <Pulse className="h-4 w-20" />
                <Pulse className="h-4 w-24" />
              </div>
              <Pulse className="h-2 w-full" />
            </div>))}
        </div>
      </div>
    </div>);
}
export function SupportSkeleton() {
    return (<div>
      <div className="flex justify-between items-center">
        <div>
          <h1>Support Tickets</h1>
          <p>Manage your support requests and get help from our team</p>
        </div>
        <button className="flex items-center opacity-50">
          <span aria-hidden="true">{iconLabel("ri-refresh-line")}</span>
          <span>Refresh</span>
        </button>
      </div>
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Ticket ID', 'Subject', 'Category', 'Status', 'Priority', 'Created', 'Last Updated'].map((h) => (<th key={h}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((i) => (<tr key={i}>
                  <td><Pulse className="h-4 w-16" /></td>
                  <td><Pulse className="h-4 w-48" /></td>
                  <td><Pulse className="h-4 w-24" /></td>
                  <td><Pulse className="h-6 w-20" /></td>
                  <td><Pulse className="h-6 w-16" /></td>
                  <td><Pulse className="h-4 w-32" /></td>
                  <td><Pulse className="h-4 w-32" /></td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
            { icon: 'ri-ticket-line', color: 'bg-blue-600/20', iconColor: 'text-blue-400', label: 'Total Tickets' },
            { icon: 'ri-time-line', color: 'bg-blue-600/20', iconColor: 'text-blue-400', label: 'Open' },
            { icon: 'ri-loader-line', color: 'bg-yellow-600/20', iconColor: 'text-yellow-400', label: 'In Progress' },
            { icon: 'ri-check-line', color: 'bg-green-600/20', iconColor: 'text-green-400', label: 'Resolved' },
        ].map((card, i) => (<div key={i}>
            <div className="flex items-center">
              <div className={uiClasses(`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`)}>
                <span aria-hidden="true">{iconLabel(`${card.icon} ${card.iconColor}`)}</span>
              </div>
              <div>
                <p>{card.label}</p>
                <Pulse className="h-6 w-8" />
              </div>
            </div>
          </div>))}
      </div>
    </div>);
}
export function AccountSkeleton() {
    return (<div>
      <div>
        <div className="flex items-center">
          <Pulse className="w-16 h-16" />
          <div>
            <Pulse className="h-7 w-48" />
            <Pulse className="h-4 w-56" />
            <Pulse className="h-4 w-40" />
          </div>
        </div>
      </div>
      <div>
        <div className="flex">
          {['Profile', 'Security', 'Account Actions'].map((tab) => (<div key={tab}>
              <span>{tab}</span>
            </div>))}
        </div>
        <div>
          <div className="flex justify-between items-center">
            <h3>Profile Information</h3>
            <button className="opacity-50">
              Edit Profile
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (<div key={i}>
                <Pulse className="h-4 w-24" />
                <Pulse className="h-11 w-full" />
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
export function ClientsSkeleton() {
    return (<div>
      <div className="flex justify-between items-center">
        <div>
          <h1>Clients</h1>
          <p>Manage and view client information</p>
        </div>
        <button className="flex items-center opacity-50">
          <span aria-hidden="true">{iconLabel("ri-refresh-line")}</span>
          <span>Refresh</span>
        </button>
      </div>
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Client ID', 'Business Name', 'Contact Name', 'Email', 'Status', 'Join Date', 'Last Activity', 'Tickets', 'Projects'].map((h) => (<th key={h}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (<tr key={i}>
                  <td><Pulse className="h-4 w-14" /></td>
                  <td><Pulse className="h-4 w-32" /></td>
                  <td><Pulse className="h-4 w-24" /></td>
                  <td><Pulse className="h-4 w-36" /></td>
                  <td><Pulse className="h-6 w-16" /></td>
                  <td><Pulse className="h-4 w-20" /></td>
                  <td><Pulse className="h-4 w-20" /></td>
                  <td><Pulse className="h-4 w-6" /></td>
                  <td><Pulse className="h-4 w-6" /></td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
            { icon: 'ri-team-line', color: 'bg-blue-600/20', iconColor: 'text-blue-400', label: 'Total Clients' },
            { icon: 'ri-check-line', color: 'bg-green-600/20', iconColor: 'text-green-400', label: 'Active' },
            { icon: 'ri-pause-line', color: 'bg-slate-600/20', iconColor: 'text-slate-400', label: 'Inactive' },
            { icon: 'ri-close-line', color: 'bg-red-600/20', iconColor: 'text-red-400', label: 'Suspended' },
        ].map((card, i) => (<div key={i}>
            <div className="flex items-center">
              <div className={uiClasses(`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`)}>
                <span aria-hidden="true">{iconLabel(`${card.icon} ${card.iconColor}`)}</span>
              </div>
              <div>
                <p>{card.label}</p>
                <Pulse className="h-6 w-8" />
              </div>
            </div>
          </div>))}
      </div>
    </div>);
}
export function ContactSubmissionsSkeleton() {
    return (<div>
      <div>
        <h1>Contact Submissions</h1>
        <p>View and manage form submissions from your website</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
            { icon: 'ri-mail-line', color: 'bg-blue-600/20', iconColor: 'text-blue-400', label: 'Total Submissions' },
            { icon: 'ri-discuss-line', color: 'bg-purple-600/20', iconColor: 'text-purple-400', label: 'Consultations' },
            { icon: 'ri-chat-3-line', color: 'bg-cyan-600/20', iconColor: 'text-cyan-400', label: 'Contact Messages' },
        ].map((card, i) => (<div key={i} className="flex items-center">
            <div className={uiClasses(`w-11 h-11 ${card.color} rounded-lg flex items-center justify-center`)}>
              <span aria-hidden="true">{iconLabel(`${card.icon} ${card.iconColor} text-lg`)}</span>
            </div>
            <div>
              <p>{card.label}</p>
              <Pulse className="h-7 w-10" />
            </div>
          </div>))}
      </div>
      <Pulse className="h-10 w-72" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => (<div className="overflow-hidden" key={i}>
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Pulse className="h-4 w-14" />
                  <Pulse className="h-5 w-24" />
                </div>
                <Pulse className="h-3 w-28" />
              </div>
              <div className="flex items-center">
                <Pulse className="w-9 h-9" />
                <div>
                  <Pulse className="h-4 w-32" />
                  <Pulse className="h-3 w-44" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Pulse className="h-3 w-28" />
                <Pulse className="h-3 w-32" />
                <Pulse className="h-3 w-36" />
                <Pulse className="h-3 w-24" />
              </div>
              <Pulse className="h-16 w-full" />
            </div>
            <div className="flex justify-between items-center">
              <Pulse className="h-4 w-14" />
              <Pulse className="h-8 w-20" />
            </div>
          </div>))}
      </div>
    </div>);
}
export function TicketDetailSkeleton() {
    return (<div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Pulse className="w-9 h-9" />
          <div>
            <Pulse className="h-7 w-40" />
            <Pulse className="h-4 w-64" />
          </div>
        </div>
        <div className="flex items-center">
          <Pulse className="h-9 w-40" />
          <Pulse className="h-9 w-36" />
        </div>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (<div key={i}>
              <Pulse className="h-4 w-20" />
              <Pulse className="h-6 w-24" />
            </div>))}
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="h-96">
          <div className="flex justify-start">
            <div className="max-w-md w-80">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-5/6" />
              <Pulse className="h-3 w-32" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-md w-72">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-3/4" />
              <Pulse className="h-3 w-28" />
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-md w-96">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-2/3" />
              <Pulse className="h-3 w-36" />
            </div>
          </div>
        </div>
        <div className="flex">
          <Pulse className="h-10 flex-1" />
          <Pulse className="h-10 w-20" />
        </div>
      </div>
    </div>);
}
export function InvoiceDetailSkeleton() {
    return (<div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Pulse className="w-9 h-9" />
          <div>
            <Pulse className="h-7 w-52" />
            <Pulse className="h-4 w-40" />
          </div>
        </div>
        <Pulse className="h-9 w-36" />
      </div>
      <div className="max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <Pulse className="h-6 w-40" />
            <Pulse className="h-4 w-52" />
            <Pulse className="h-4 w-36" />
            <Pulse className="h-4 w-44" />
          </div>
          <div className="flex flex-col items-end">
            <Pulse className="h-8 w-36" />
            <Pulse className="h-4 w-24" />
            <Pulse className="h-6 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (<div key={i}>
              <Pulse className="h-3 w-20" />
              <Pulse className="h-4 w-32" />
              <Pulse className="h-4 w-28" />
              <Pulse className="h-4 w-36" />
              <Pulse className="h-4 w-24" />
            </div>))}
        </div>
        <div>
          <div className="flex">
            <Pulse className="h-4 flex-1" />
            <Pulse className="h-4 w-12" />
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-24" />
          </div>
          {[1, 2, 3].map((i) => (<div key={i} className="flex">
              <div className="flex-1">
                <Pulse className="h-4 w-56" />
                <Pulse className="h-3 w-72" />
              </div>
              <Pulse className="h-4 w-8" />
              <Pulse className="h-4 w-20" />
              <Pulse className="h-4 w-20" />
            </div>))}
        </div>
        <div className="flex justify-end">
          <div className="w-full sm:w-72">
            <div className="flex justify-between">
              <Pulse className="h-4 w-20" />
              <Pulse className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Pulse className="h-4 w-16" />
              <Pulse className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Pulse className="h-5 w-24" />
              <Pulse className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>);
}
