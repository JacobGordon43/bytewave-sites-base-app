import { uiClasses, iconLabel } from "../utils/presentation";
import type { selectEnrichedPayments } from "../redux/selectors/paymentsSelectors";
export default function AdminBillingStats({ invoices = [], }: {
    invoices?: ReturnType<typeof selectEnrichedPayments>;
}) {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const total = safeInvoices.reduce((sum, inv) => sum + (typeof inv.paymentData.amount === 'number' ? inv.paymentData.amount : 0), 0);
    const paid = safeInvoices
        .filter((i) => i.paymentData.status === 'Completed')
        .reduce((sum, i) => sum + (typeof i.paymentData.amount === 'number' ? i.paymentData.amount : 0), 0);
    const pending = safeInvoices
        .filter((i) => i.paymentData.status === 'Pending')
        .reduce((sum, i) => sum + (typeof i.paymentData.amount === 'number' ? i.paymentData.amount : 0), 0);
    const overdue = safeInvoices
        .filter((i) => i.paymentData.status === 'Overdue')
        .reduce((sum, i) => sum + (typeof i.paymentData.amount === 'number' ? i.paymentData.amount : 0), 0);
    const stats = [
        {
            label: 'Total Invoiced',
            value: `$${total.toLocaleString()}`,
            icon: 'ri-money-dollar-circle-line',
            color: 'bg-blue-600',
        },
        {
            label: 'Collected',
            value: `$${paid.toLocaleString()}`,
            icon: 'ri-checkbox-circle-line',
            color: 'bg-green-600',
        },
        {
            label: 'Awaiting Payment',
            value: `$${pending.toLocaleString()}`,
            icon: 'ri-time-line',
            color: 'bg-yellow-600',
        },
        {
            label: 'Overdue',
            value: `$${overdue.toLocaleString()}`,
            icon: 'ri-error-warning-line',
            color: 'bg-red-600',
        },
    ];
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats?.map((stat) => (<div key={stat.label}>
          <div className={uiClasses(`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`)}>
            <span aria-hidden="true">{iconLabel(`${stat.icon} text-white text-xl`)}</span>
          </div>
          <p>{stat.label}</p>
          <p>{stat.value}</p>
        </div>))}
    </div>);
}
