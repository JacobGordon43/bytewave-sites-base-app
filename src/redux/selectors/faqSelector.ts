import { faqAdapter } from "../adapters/faqAdapter";
import type { RootState } from "../store";

const adapterSelectors = faqAdapter.getSelectors<RootState>((state)=>state.faq);
export const selectFAQSections = adapterSelectors.selectAll