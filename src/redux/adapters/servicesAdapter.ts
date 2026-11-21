import { createEntityAdapter } from "@reduxjs/toolkit";
import type { ServiceData } from "../../types/daoTypes";

export const servicesAdapter = createEntityAdapter({
    selectId: (service: ServiceData) => service.id,
    sortComparer: (a, b) => a.index - b.index
})