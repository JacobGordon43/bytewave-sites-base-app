import { portfolioAdapter } from "../adapters/portfolioAdapter";
import type { RootState } from "../store";

const adapterSelectors = portfolioAdapter.getSelectors<RootState>((state)=>state.portfolio)
export const selectPortfolio = adapterSelectors.selectAll