// store/adapters/ticketsAdapter.ts
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { TicketData } from "../../types/daoTypes";

export const ticketsAdapter = createEntityAdapter({
  selectId: (ticket : TicketData) => ticket.id,
  sortComparer: (a, b) => b.dateCreated - a.dateCreated,
});
