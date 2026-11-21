import { createEntityAdapter } from "@reduxjs/toolkit";
import type { ClientData } from "../../types/daoTypes";

export const clientAdapter = createEntityAdapter({
  selectId: (client:ClientData) => client.id,
  sortComparer: (a, b) => b.dateJoined - a.dateJoined
});