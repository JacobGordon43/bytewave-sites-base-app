// store/adapters/ticketsAdapter.ts
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { PaymentData } from "../../types/daoTypes";

export const paymentsAdapter = createEntityAdapter({
  selectId: (payment : PaymentData) => payment.id,
  sortComparer: (a, b) => b.date - a.date,
});
