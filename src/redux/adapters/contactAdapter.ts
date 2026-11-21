import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Submission } from "../../types/daoTypes";

export const contactAdapter = createEntityAdapter({
    selectId: (submission: Submission)=>submission.id,
    sortComparer: (a, b) => b.submittedAt - a.submittedAt
})