import { createEntityAdapter } from "@reduxjs/toolkit";
import type { HostingData } from "../../types/daoTypes";

export const hostingAdapter = createEntityAdapter({
    selectId: (hostingData : HostingData) => hostingData.id,
    sortComparer: (a, b) => b.endTime - a.endTime,
})
