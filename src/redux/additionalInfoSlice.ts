import { createAsyncThunk, createSlice, type PayloadAction} from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import type { ReferralData, MetricData } from "../types/daoTypes";
import adminService from "../services/adminService";

export const fetchReferrals = createAsyncThunk<ReferralData[], void>("additionalInfo/fetchReferrals", async(_, thunkAPI)=>{
    try{
        const referrals = await adminService.getReferrals();
        return referrals;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch referrals: ${errorMessage}`);
    }
})

export const fetchReferralsById = createAsyncThunk("additionalInfo/fetchReferralsById", async(clientId: string, thunkAPI) => {
    try{
        if(!clientId){
            return thunkAPI.rejectWithValue("No clientId provided");
        }

        const referrals = await adminService.getReferralsById(clientId);

        if(!referrals){
            return thunkAPI.rejectWithValue("No referral data was retrieved");
        }
        return {referrals, clientId};
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch referral data: ${errorMessage}`);
    }
})
export const createReferral = createAsyncThunk<ReferralData,  {referredBy: string, referral:string}>("additionalInfo/createReferral", 
    async({referredBy, referral}, thunkAPI) =>{
        try{
            const newReferral = await adminService.createReferral(referredBy, referral)
            if(!newReferral){
                throw new Error("New Referral was undefined");
            }
            return newReferral;
        }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to create referral: ${errorMessage}`);        
    }
    }
)

export const fetchRevenue = createAsyncThunk("additionalInfo/fetchRevenue", async(_, thunkAPI) =>{
    try{
        const revenue = await adminService.getMetricData("revenue");
        if(!revenue){
            throw Error("Revenue Metric data was not found.")
        }

        return revenue;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch revenue: ${errorMessage}`);        

    }
})

interface AdditionalInfoState {
    referrals: ReferralData[],
    clientAdditionalInfoFetched: Record<string, boolean>,
    revenue: number | null,
    loadingFetch: boolean,
    fetchStatus: FetchStatus,
    referralFetchStatus: FetchStatus,
    loadingCreate: boolean,
    referralError: string | null,
    revenueError: string | null
}

const initialState: AdditionalInfoState = {
    referrals: [],
    revenue: null,
    clientAdditionalInfoFetched: {},
    loadingFetch: false,
    fetchStatus: "idle",
    referralFetchStatus: "idle",
    loadingCreate: false,
    referralError: null,
    revenueError: null
}

const additionalInfoSlice = createSlice({
    name: "additionalInfo",
    initialState,
    reducers: {
        clearInfo(state){
            state.referrals = [];
            state.fetchStatus = "idle";
            state.referralError = null;
            state.revenueError = null;
        },
        resetAdditionalInfoSlice: () => initialState,
        clearReferralError(state){
            state.referralError = null;
        },
        clearRevenueError(state){
            state.revenueError = null;
        },
        setReferralError(state, action: PayloadAction<string>){
            state.referralError = action.payload;
        },
        setRevenueError(state, action: PayloadAction<string>){
            state.revenueError = action.payload;
        },
        //Revenue is automatically updated via the create payment lambda function
        addRevenue(state, action: PayloadAction<number>){
            if(!state.revenue){
                state.revenue = 0;
            }
            state.revenue += action.payload
        }
    },
    extraReducers: (builder)=>{
        builder
            .addCase(fetchReferrals.pending, (state)=>{
                state.loadingFetch = true;
                state.referralFetchStatus = "loading";
                state.referralError = null;
            })
            .addCase(fetchReferrals.fulfilled, (state, action : PayloadAction<ReferralData[]>)=>{
                state.loadingFetch = false;
                state.referralFetchStatus = "succeeded";
                state.referrals = action.payload;
                state.referralError = null;
            })
            .addCase(fetchReferrals.rejected, (state, action)=>{
                state.loadingFetch = false;
                state.referralFetchStatus = "failed";
                state.referralError = action.payload as string
            })
            .addCase(fetchReferralsById.pending, (state)=>{
                state.loadingFetch = true;
                state.fetchStatus = "loading";
                state.referralError = null;
            })
            .addCase(fetchReferralsById.fulfilled, (state, action)=>{
                state.loadingFetch = false;
                state.fetchStatus = "succeeded";
                state.referrals = action.payload.referrals;
                state.clientAdditionalInfoFetched[action.payload.clientId] = true;
                state.referralError = null;
            })
            .addCase(fetchReferralsById.rejected, (state, action)=>{
                state.loadingFetch = false;
                state.fetchStatus = "failed";
                state.referralError = action.payload as string;
            })
            .addCase(fetchRevenue.pending, (state)=>{
                state.loadingFetch = true;
                state.fetchStatus = "loading";
                state.revenueError = null;
            })
            .addCase(fetchRevenue.fulfilled, (state, action : PayloadAction<MetricData>)=>{
                state.loadingFetch = false;
                state.fetchStatus = "succeeded";
                state.revenue = action.payload.totalRevenueCents || 0;
                state.revenueError = null;
            })
            .addCase(fetchRevenue.rejected, (state, action)=>{
                state.loadingFetch = false;
                state.fetchStatus = "failed";
                state.revenueError = action.payload as string
            })
            .addCase(createReferral.pending, (state)=>{
                state.loadingCreate = true;
                state.referralError = null;
            })
            .addCase(createReferral.fulfilled, (state, action: PayloadAction<ReferralData>)=>{
                state.loadingCreate = false;
                state.referrals.push(action.payload)
                state.referralError = null;
            })
            .addCase(createReferral.rejected, (state, action)=>{
                state.loadingCreate = false;
                state.referralError = action.payload as string
            })
    }
})

export const {
    clearInfo,
    resetAdditionalInfoSlice,
    clearReferralError,
    clearRevenueError,
    setReferralError,
    setRevenueError,
    addRevenue
} = additionalInfoSlice.actions;
export default additionalInfoSlice.reducer;
