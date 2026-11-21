import { servicesAdapter } from "../adapters/servicesAdapter";
import type { RootState } from "../store";

const adapterSelectors = servicesAdapter.getSelectors<RootState>((state)=>state.services)
export const selectServices = adapterSelectors.selectAll