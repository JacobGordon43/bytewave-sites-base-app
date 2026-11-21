'use client';
import { useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import AdminBillingDashboard from '../../components/AdminBillingDashboard';
import { AdminBillingSkeleton } from '../../components/SkeletonLoader';
import type { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPayments } from '../../redux/paymentsSlice';
import { fetchClients } from '../../redux/clientSlice';
import { useAuth } from '../../auth/AuthContext';
export default function AdminBilling({ readOnly = false }: {
    readOnly?: boolean;
}) {
    const auth = useAuth();
    const linkType = readOnly || auth.groups.includes("Support") ? "support" : "admin";
    const paymentSlice = useSelector((state: RootState) => state.payments);
    const clientSlice = useSelector((state: RootState) => state.clients);
    const dispatch = useDispatch<AppDispatch>();
    useEffect(() => {
        if (paymentSlice.fetchStatus === "idle") {
            dispatch(fetchPayments());
        }
        if (clientSlice.fetchStatus === "idle") {
            dispatch(fetchClients());
        }
    }, [dispatch]);
    if (paymentSlice.loadingFetch) {
        return (<DashboardLayout currentPage="invoices" linkType={linkType}>
        <AdminBillingSkeleton />
      </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="invoices" linkType={linkType}>
      <AdminBillingDashboard readOnly={readOnly}/>
    </DashboardLayout>);
}
