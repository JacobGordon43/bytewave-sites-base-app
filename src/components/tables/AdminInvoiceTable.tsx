import { uiClasses, uiStyle, iconLabel } from "../../utils/presentation";
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import type { PaymentData } from '../../types/daoTypes';
import { selectEnrichedPayments } from '../../redux/selectors/paymentsSelectors';
import { useNavigate } from 'react-router-dom';
const ACTIONS_MENU_WIDTH = 176;
const ACTIONS_MENU_HEIGHT = 220;
const ACTIONS_MENU_GAP = 8;
const VIEWPORT_GUTTER = 12;
type OpenMenu = {
    invoice: PaymentData;
    left: number;
    opensUp: boolean;
    verticalPosition: number;
};
interface Props {
    onStatusChange: (id: string, status: PaymentData['status']) => void;
    onDelete: (paymentData: PaymentData) => Promise<void>;
    loadingDelete: boolean;
    invoices: ReturnType<typeof selectEnrichedPayments>;
    readOnly?: boolean;
}
export default function AdminInvoiceTable({ onStatusChange, onDelete, loadingDelete, invoices, readOnly = false, }: Props) {
    const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<PaymentData | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    useEffect(() => {
        if (!openMenu)
            return;
        const closeMenu = () => setOpenMenu(null);
        const closeMenuWithEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape')
                closeMenu();
        };
        window.addEventListener('resize', closeMenu);
        window.addEventListener('scroll', closeMenu, true);
        document.addEventListener('keydown', closeMenuWithEscape);
        return () => {
            window.removeEventListener('resize', closeMenu);
            window.removeEventListener('scroll', closeMenu, true);
            document.removeEventListener('keydown', closeMenuWithEscape);
        };
    }, [openMenu]);
    useEffect(() => {
        if (!openMenu || !menuRef.current)
            return;
        const direction = openMenu.opensUp ? 6 : -6;
        const animation = menuRef.current.animate([
            {
                opacity: 0,
                transform: `translateY(${direction}px) scale(0.98)`,
            },
            { opacity: 1, transform: 'translateY(0) scale(1)' },
        ], {
            duration: 140,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        });
        return () => animation.cancel();
    }, [openMenu]);
    const handleMenuToggle = (event: MouseEvent<HTMLButtonElement>, invoice: PaymentData) => {
        if (openMenu?.invoice.id === invoice.id) {
            setOpenMenu(null);
            return;
        }
        const buttonBounds = event.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonBounds.bottom;
        const opensUp = spaceBelow < ACTIONS_MENU_HEIGHT + ACTIONS_MENU_GAP &&
            buttonBounds.top > spaceBelow;
        const maximumLeft = window.innerWidth - ACTIONS_MENU_WIDTH - VIEWPORT_GUTTER;
        const left = Math.max(VIEWPORT_GUTTER, Math.min(buttonBounds.right - ACTIONS_MENU_WIDTH, maximumLeft));
        setOpenMenu({
            invoice,
            left,
            opensUp,
            verticalPosition: opensUp
                ? window.innerHeight - buttonBounds.top + ACTIONS_MENU_GAP
                : buttonBounds.bottom + ACTIONS_MENU_GAP,
        });
    };
    const statusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-500/20 text-green-400';
            case 'Pending':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'Overdue':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-slate-500/20 text-slate-400';
        }
    };
    if (!Array.isArray(invoices)) {
        console.error('AdminInvoiceTable expects `invoices` to be an array.');
        return null;
    }
    if (invoices.length === 0) {
        return (<div>
        <span aria-hidden="true">{iconLabel("ri-file-list-3-line text-4xl mb-3 block")}</span>
        <p>No invoices found.</p>
      </div>);
    }
    return (<>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {[
            'Client',
            'Description',
            'Platform',
            'Amount',
            'Date',
            'Due Date',
            'Status',
            '',
        ].map((h) => (<th key={h}>
                  {h}
                </th>))}
            </tr>
          </thead>
          <tbody>
            {invoices?.map((inv) => (<tr key={inv.paymentData.id}>
                <td>
                  {inv.businessName}
                </td>
                <td className="max-w-xs">
                  {inv.paymentData.items?.map((item, index) => {
                return item.item + `${index < inv.paymentData.items.length - 1 ? ", " : ""}`;
            })}
                </td>
                <td>
                  {inv.paymentData.platform ? (<span className="inline-flex">
                      {inv.paymentData.platform}
                    </span>) : (<span>—</span>)}
                </td>
                <td>
                  ${inv.paymentData.amount.toLocaleString()}
                </td>
                <td>
                  {new Date(inv.paymentData.date).toLocaleDateString()}
                </td>
                <td>
                  {new Date(inv.paymentData.date).toLocaleDateString()}
                </td>
                <td>
                  <span className={uiClasses(`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${statusColor(inv.paymentData.status)}`)}>
                    {inv.paymentData.status}
                  </span>
                </td>
                <td className="relative">
                  <button type="button" aria-haspopup="menu" aria-expanded={openMenu?.invoice.id === inv.paymentData.id} aria-label={`Open actions for invoice ${inv.paymentData.id}`} onClick={(event) => handleMenuToggle(event, inv.paymentData)} className="w-8 h-8 flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-more-2-fill")}</span>
                  </button>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {openMenu && createPortal(<>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpenMenu(null)}/>
          <div className="fixed z-50 w-44 overflow-hidden" ref={menuRef} role="menu" aria-label={`Actions for invoice ${openMenu.invoice.id}`} style={uiStyle({
            left: openMenu.left,
            ...(openMenu.opensUp
                ? { bottom: openMenu.verticalPosition, transformOrigin: 'bottom right' }
                : { top: openMenu.verticalPosition, transformOrigin: 'top right' }),
        })}>
            <button type="button" role="menuitem" onClick={() => navigate(`${readOnly ? "/support/billing" : "/admin/billing"}/invoice/${openMenu.invoice.id}`)} className="flex w-full items-center gap-2.5">
              <span aria-hidden="true">{iconLabel("ri-eye-line text-base")}</span> View Invoice
            </button>
            {!readOnly && <div></div>}
            {!readOnly && openMenu.invoice.status !== 'Completed' && (<button type="button" role="menuitem" onClick={() => {
                    onStatusChange(openMenu.invoice.id, 'Completed');
                    setOpenMenu(null);
                }} className="flex w-full items-center gap-2.5">
                <span aria-hidden="true">{iconLabel("ri-checkbox-circle-line text-base")}</span> Mark as Paid
              </button>)}
            {!readOnly && openMenu.invoice.status !== 'Pending' && (<button type="button" role="menuitem" onClick={() => {
                    onStatusChange(openMenu.invoice.id, 'Pending');
                    setOpenMenu(null);
                }} className="flex w-full items-center gap-2.5">
                <span aria-hidden="true">{iconLabel("ri-time-line text-base")}</span> Mark as Pending
              </button>)}
            {!readOnly && openMenu.invoice.status !== 'Overdue' && (<button type="button" role="menuitem" onClick={() => {
                    onStatusChange(openMenu.invoice.id, 'Overdue');
                    setOpenMenu(null);
                }} className="flex w-full items-center gap-2.5">
                <span aria-hidden="true">{iconLabel("ri-error-warning-line text-base")}</span> Mark as Overdue
              </button>)}
            {!readOnly && <div></div>}
            {!readOnly && <button type="button" role="menuitem" onClick={() => {
                    setConfirmDelete(openMenu.invoice);
                    setOpenMenu(null);
                }} className="flex w-full items-center gap-2.5">
              <span aria-hidden="true">{iconLabel("ri-delete-bin-line text-base")}</span> Delete
            </button>}
          </div>
        </>, document.body)}

      
      {!readOnly && confirmDelete && (<div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <h4>
              Delete Invoice
            </h4>
            <p>
              Are you sure you want to delete{' '}
              <span>{confirmDelete.id}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button onClick={async () => {
                try {
                    await onDelete(confirmDelete);
                    setConfirmDelete(null);
                }
                catch {
                }
            }} disabled={loadingDelete} className={uiClasses(`px-4 py-2 text-sm text-white rounded-lg transition-colors ${loadingDelete ? 'bg-red-900/60 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'}`)}>
                {loadingDelete ? 'Deleting' : 'Delete'}
              </button>
            </div>
          </div>
        </div>)}
    </>);
}
