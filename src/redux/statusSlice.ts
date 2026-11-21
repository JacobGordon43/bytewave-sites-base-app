import { createSlice, type PayloadAction } from "@reduxjs/toolkit"; 
import type { Status } from "../types/daoTypes";
const initialState: {
    loading: boolean, 
    status: Status,
    error: string | null
    } = { status: "operational", loading: true, error: null }; 
const statusSlice = createSlice({ 
    name: "status", 
    initialState, 
    reducers: { 
        setPlatformStatus: (state, action: PayloadAction<Status>) => { 
            state.status = action.payload; 
            state.loading = false; 
            state.error = null;
        },
        setStatusError: (state, action:PayloadAction<string | null>) =>{
            state.error = action.payload
        },
    } 
});
export const { setPlatformStatus, setStatusError } = statusSlice.actions; 
export default statusSlice.reducer;