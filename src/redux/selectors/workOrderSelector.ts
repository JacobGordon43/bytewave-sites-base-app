import { workOrderAdapter } from "../adapters/workOrderAdapter";
import type { RootState } from "../store";

const adapterSelectors = workOrderAdapter.getSelectors<RootState>((state)=>state.workOrders)
export const selectWorkOrders = adapterSelectors.selectAll