import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { PaymentData } from "../../types/daoTypes";
import { paymentsAdapter } from "../adapters/paymentsAdapter";
import { clientAdapter } from "../adapters/clientAdapter";
//Combines payment data with the businessName to display the information needed for both
const adapterSelectors = paymentsAdapter.getSelectors<RootState>((state)=> state.payments)
const clientAdapterSelectors = clientAdapter.getSelectors<RootState>((state)=> state.clients)
export const selectPayments = adapterSelectors.selectAll

export const selectEnrichedPayments = createSelector(
    (state:RootState) => selectPayments(state),
    (state:RootState) => clientAdapterSelectors.selectAll(state),
    (payments, clients) =>{
        const clientMap = new Map(clients?.map(client => [client.id, client]));
        return payments?.map((payment): {paymentData: PaymentData, businessName : string} => {
            const client = clientMap.get(payment.clientId);
            return {
                paymentData: {...payment},
                businessName : client?.businessName ?? "Unknown"
            }
        })
    }
)

export const selectPaymentById = (paymentId: string) => createSelector(
    (state:RootState) => selectPayments(state),
    (state:RootState) => clientAdapterSelectors.selectAll(state),
    (payments, clients) => {
        const payment =payments.find(payment => payment.id === paymentId);
        if(!payment) return null;
        
        const client = clients.find(client => client.id === payment.clientId);
        return {
            ...payment,
            //businessName: client?.businessName ?? "Unknown"
            client: client
        }
    }
);