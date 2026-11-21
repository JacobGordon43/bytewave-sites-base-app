import { createEntityAdapter } from "@reduxjs/toolkit";
import type { WorkOrderData } from "../../types/daoTypes";

export const workOrderAdapter = createEntityAdapter({
    selectId: (workOrder: WorkOrderData) => workOrder.id,
    sortComparer: (a, b) =>a.expectedCompletion - b.expectedCompletion
})