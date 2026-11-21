import type { RootState } from "../store"

import { ticketsAdapter } from "../adapters/ticketsAdapter";
import { createSelector } from "@reduxjs/toolkit";
const adapterSelectors = ticketsAdapter.getSelectors<RootState>((state)=>state.tickets)

export const selectAllTickets = adapterSelectors.selectAll
export const selectTicketById = adapterSelectors.selectById

// export const selectTicketsInProgress = (state: RootState) =>
//     adapterSelectors.selectAll(state).filter((ticket)=>ticket.status === "In Progress");

export const selectTicketsByClient = (clientId : string) => (state: RootState) => 
    adapterSelectors.selectAll(state).filter(
        (ticket) => ticket.createdById === clientId
    )

export const selectTicketsInProgress = createSelector([adapterSelectors.selectAll], (tickets) => tickets.filter((ticket) => ticket.status === "In Progress"))

// export const selectTicketById = (ticketId: string, clientId: string) => 
//     createSelector(
//         (state:RootState) => state.tickets.tickets,
//         (state:RootState)=>state.tickets.ticketsByClients,
//         (tickets, ticketsByClients) =>{
//             logger.info("In ticketSelector");
//             if(!ticketId) return undefined;
//             //Gets a specified ticket and used the client ID or lack thereof to locate which array it's in and access it.
//             if(!clientId){
//                 return tickets.find(t=>t.id === ticketId);
//             }else{
//                 logger.info("ClientId defined");
//                 const clientTickets = ticketsByClients[clientId] || []
//                 return clientTickets.find(t=>t.id === ticketId);
//             }
//         }
//     )
