'use client';
import { siteConfig } from "../../config/site";
import { iconLabel } from "../../utils/presentation";
import DashboardLayout from '../../components/DashboardLayout';
import { Link } from 'react-router-dom';
import { selectPaymentById } from '../../redux/selectors/paymentsSelectors';
import { useSelector } from 'react-redux';
interface InvoiceDetailProps {
    invoiceId: string;
}
export default function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
    const record = useSelector(selectPaymentById(invoiceId));
    const handleDownload = () => {
        window.print();
    };
    if (!record) {
        return (<DashboardLayout linkType="client" currentPage="billing">
        <div className="max-w-3xl">
          <div className="w-14 h-14 flex items-center justify-center">
            <span aria-hidden="true">{iconLabel("ri-file-warning-line text-2xl text-slate-300")}</span>
          </div>
          <h1>Invoice not found</h1>
          <p>
            We couldn't find an invoice for this entry.
          </p>
          <Link to="/dashboard/billing" className="inline-flex items-center">
            <span aria-hidden="true">{iconLabel("ri-arrow-left-line")}</span>
            <span>Back to Billing</span>
          </Link>
        </div>
      </DashboardLayout>);
    }
    const subtotal = record.amount;
    const total = subtotal;
    return (<DashboardLayout linkType="client" currentPage="billing">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard/billing" className="w-9 h-9 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-arrow-left-line text-xl")}</span>
            </Link>
            <div>
              <h1>Invoice {record.id}</h1>
              <p>
                Issued {new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={handleDownload} className="inline-flex items-center">
            <span aria-hidden="true">{iconLabel("ri-download-2-line")}</span>
            <span>Download PDF</span>
          </button>
        </div>

        <div className="max-w-4xl overflow-hidden" id="invoice-print-area">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p>ByteWave Sites</p>
                
                
                <p>{"billing@bytewavesites.com".replaceAll("Bytewave Sites", siteConfig.name).replaceAll("billing@bytewavesites.com", siteConfig.billingEmail)}</p>
                
              </div>
              <div>
                <p>INVOICE</p>
                <p>{record.id}</p>
                <span className="inline-flex items-center">
                  <span aria-hidden="true">{iconLabel("ri-checkbox-circle-fill")}</span>
                  <span>{record.status}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p>Billed To</p>
                <p>{record.client?.businessName}</p>
                <p>{record.client?.clientFirstName} {record.client?.clientLastName}</p>
                
              </div>
              <div>
                <p>Issue Date</p>
                <p>{new Date(record.date).toLocaleDateString()}</p>
                
                
              </div>
              <div>
                <p>Payment Method</p>
                <p>{record.platform}</p>
                
                
              </div>
            </div>

            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="w-16">Qty</th>
                    <th className="w-28">Unit Price</th>
                    <th className="w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {record.items.map((item, index) => (<tr key={index}>
                      <td>
                        {item.item && <p>{item.item}</p>}
                      </td>
                      <td>{item.quantity}</td>
                      <td>${item.unitPrice.toFixed(2)}</td>
                      <td>
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-72">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  
                  
                </div>
                <div className="flex justify-between">
                  <span>Total Paid</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <p>Paid via {record.platform}</p>
              </div>
            </div>

            <div>
              <p>{"Thank you for your business. This invoice was generated for the billed item above.\r\n                For any questions about this charge, contact billing@bytewavesites.com.".replaceAll("Bytewave Sites", siteConfig.name).replaceAll("billing@bytewavesites.com", siteConfig.billingEmail)}</p>
            </div>
          </div>
          <div>
            <p>
              ByteWave Sites · This is a computer-generated invoice.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>);
}
