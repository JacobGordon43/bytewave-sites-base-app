import { createEntityAdapter } from "@reduxjs/toolkit";
import type { AboutSectionData } from "../../types/daoTypes";

export const aboutAdapter = createEntityAdapter({
    selectId: (about: AboutSectionData) => about.id,
    sortComparer: (a, b) => a.index - b.index
})