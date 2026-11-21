import { createEntityAdapter } from "@reduxjs/toolkit";
import type { FAQSectionData } from "../../types/daoTypes";

export const faqAdapter = createEntityAdapter({
    selectId: (faqSectionData: FAQSectionData) => faqSectionData.id,
    sortComparer: (a, b) => a.index - b.index
})