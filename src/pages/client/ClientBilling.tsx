import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../../components/DashboardLayout";
import SEO from "../../components/SEO";
import type { AppDispatch, RootState } from "../../redux/store";
import { selectEnrichedPayments } from "../../redux/selectors/paymentsSelectors";
import { selectHostingData } from "../../redux/selectors/hostingSelector";
import { fetchPayments } from "../../redux/paymentsSlice";
import { useEffect } from "react";
import { fetchHostingData } from "../../redux/hostingSlice";
import { Link } from "react-router-dom";
import { fetchReferralsById } from "../../redux/additionalInfoSlice";
import { useAuth } from "../../auth/AuthContext";
import SubscriptionsPanel from "../../components/SubscriptionsPanel";
import { useSubscriptions } from "../../hooks/useSubscriptions";
export default function ClientBilling() {
    const auth = useAuth();
    const hostingSlice = useSelector((state: RootState) => state.hosting);
    const allPayments = useSelector(selectEnrichedPayments);
    const paymentData = allPayments.filter((item) => item.paymentData.clientId === auth.sub);
    const hostingData = useSelector(selectHostingData).filter(item => item.clientId === auth.sub);
    const additionalInfoSlice = useSelector((state: RootState) => state.additionalInfo);
    const dispatch = useDispatch<AppDispatch>();
    const subscriptionState = useSubscriptions({
        clientId: auth.sub,
        onRefresh: () => {
            void dispatch(fetchHostingData());
            void dispatch(fetchPayments());
        },
    });
    useEffect(() => { if (auth.sub)
        void dispatch(fetchPayments()); }, [auth.sub, dispatch]);
    useEffect(() => {
        if (hostingSlice.fetchStatus === "idle") {
            dispatch(fetchHostingData());
        }
        if (additionalInfoSlice.referralFetchStatus === "idle") {
            dispatch(fetchReferralsById(auth.sub || ""));
        }
    }, [additionalInfoSlice.referralFetchStatus, auth.sub, hostingSlice.fetchStatus, dispatch]);
    const calculateHostingSavings = (): number => {
        if (!additionalInfoSlice.referrals || additionalInfoSlice.referrals.length === 0)
            return 0;
        const totalSavings = additionalInfoSlice.referrals.reduce((total, acc) => {
            return total + (acc.status === "Rewarded" ? 30 : 0);
        }, 0);
        return totalSavings;
    };
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (<DashboardLayout currentPage="billing" linkType="client">
      <SEO title={"Bytewave Sites | Client Billing".replaceAll("Bytewave Sites", siteConfig.name)}/>    
      <div>
        <Link to="/client/payments" className="inline-flex">View outstanding payments</Link>
        <SubscriptionsPanel subscriptionState={subscriptionState}/>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-money-dollar-circle-line text-white text-xl")}</span>
              </div>
            </div>
            <div>
              <p>Current Billing Plan</p>
            </div>
            <div>
              <p>
                {subscriptionState.loading ? "Loading..." : subscriptionState.billingCycle}
              </p>
            </div>
            <div>
              <p>
                {subscriptionState.activeSubscription?.cancelAtPeriodEnd
            ? "Cancellation scheduled"
            : subscriptionState.activeSubscription
                ? `$${subscriptionState.activeSubscription.amount.toFixed(2)} per billing period`
                : subscriptionState.error || "No automatic renewal"}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-calendar-line text-white text-xl")}</span>
              </div>
            </div>
            <div>
              <p>Hosting Paid Through</p>
            </div>
            <div>
              <p>{hostingData[0]?.selfHosted ? "N/A" : (hostingData.length > 0 ? new Date(hostingData[0]?.endTime).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "No Data")}</p>
            </div>
            <div>
              <p>{hostingData[0]?.selfHosted ? "Self Hosted" : (hostingData.length > 0 ? new Date(hostingData[0]?.endTime).getFullYear().toString() : "Reach out to Support to get your website hosted")}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-gift-line text-white text-xl")}</span>
              </div>
            </div>
            <div>
              <p>Referral Savings</p>
            </div>
            <div>
              <p>${calculateHostingSavings()}</p>
            </div>
            <div>
              <p> {calculateHostingSavings() / 30} months saved</p>
            </div>
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
                  <th>
                    Date
                  </th>
                  <th>
                    Description
                  </th>
                  <th>
                    Amount
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody>
                {paymentData.map((item) => (<tr key={item.paymentData.id}>
                    <td>
                      {new Date(item.paymentData.date).toLocaleDateString()}
                    </td>
                    <td>
                      {item.paymentData.items?.map(({ item, quantity }) => `${item} × ${quantity}`).join(", ") || "—"}
                    </td>
                    <td>
                      ${item.paymentData.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className={uiClasses(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.paymentData.status)}`)}>
                        {item.paymentData.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/client/billing/invoice/${item.paymentData.id}`} className="inline-flex items-center">
                        <span aria-hidden="true">{iconLabel("ri-file-text-line")}</span>
                        <span>{item.paymentData.id}</span>
                        <span aria-hidden="true">{iconLabel("ri-arrow-right-line text-xs")}</span>
                      </Link>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>);
}
