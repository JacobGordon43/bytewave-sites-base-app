import { createEntityAdapter } from "@reduxjs/toolkit";
import type { PortfolioData } from "../../types/daoTypes";

export const portfolioAdapter = createEntityAdapter({
    selectId: (portfolio: PortfolioData) => portfolio.id,
    sortComparer: (a, b) => a.title.localeCompare(b.title)
})