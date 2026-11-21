import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { PaymentData } from "../../types/daoTypes";
import { projectsAdapter } from "../projectSlice";
import { hostingAdapter } from "../adapters/hostingAdapter";
import { ticketsAdapter } from "../adapters/ticketsAdapter";
import { clientAdapter } from "../adapters/clientAdapter";
import { paymentsAdapter } from "../adapters/paymentsAdapter";

const ticketsSelector = ticketsAdapter.getSelectors<RootState>((state)=>state.tickets)
const projectsSelector = projectsAdapter.getSelectors<RootState>((state)=>state.projects)
const hostingSelector = hostingAdapter.getSelectors<RootState>((state)=>state.hosting)
const clientsSelector = clientAdapter.getSelectors<RootState>((state:RootState)=>state.clients)
const paymentsSelector = paymentsAdapter.getSelectors<RootState>((state: RootState)=>state.payments)
// import { createSelector } from "@reduxjs/toolkit";
// import { RootState } from "../store";
// import { ClientData, PaymentData } from "../../types/daoTypes";


export const selectEnrichedClients = createSelector(
    (state : RootState) => clientsSelector.selectAll(state),
    (state : RootState) => paymentsSelector.selectAll(state),
    (state : RootState) => state.additionalInfo.referrals,
    (state : RootState) =>projectsSelector.selectAll(state),
    (state: RootState) =>ticketsSelector.selectAll(state),
    (state:RootState) => hostingSelector.selectAll(state),
    (clients, payments, referrals, projects, tickets, hosting) => {
        const paymentsByClient = new Map<string, PaymentData[]>();
        //Grouping payments by clientId
        for(const payment of payments){
            //If the clientId doesn't exist in the map, it adds them with an empty array
            if(!paymentsByClient.has(payment.clientId)){
                paymentsByClient.set(payment.clientId, [])
            };
            //Pushes the payment to the specific client
            paymentsByClient.get(payment.clientId)?.push(payment);
        }
        //const projectsByClient = new Map<string, ProjectData[]>();
        
        //Enrich each client with totalPaid and a payment list
        return clients.map(client => {
            //If the client has no past payments, they'll be assigned an empty array
            const clientPayments = paymentsByClient.get(client.id) || []
            //Starts with an initial value of 0 and adds each payment amount to the sum
            const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
            const clientTickets = tickets.filter((ticket)=>ticket.createdById === client.id) || null
            const clientProjects = projects.filter((project)=>project.clientId === client.id) || null;
            const clientHosting = hosting.filter((hostingData)=>hostingData.clientId === client.id)
            const clientReferrals = referrals.filter((referral) => referral.referredBy === client.id)
            return {
                ...client,
                totalPaid,
                projects: clientProjects,
                payments: clientPayments,
                tickets: clientTickets,
                hosting: clientHosting,
                referrals: clientReferrals
            } 
        })
    }
)

export const selectClientById = clientsSelector.selectById
export const selectClients = clientsSelector.selectAll