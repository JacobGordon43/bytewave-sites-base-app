import { hostingAdapter } from "../adapters/hostingAdapter";
import type { RootState } from "../store";

const adapterSelectors = hostingAdapter.getSelectors<RootState>((state)=>state.hosting);
export const selectHostingData = adapterSelectors.selectAll