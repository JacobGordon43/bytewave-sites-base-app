import type { RootState } from "./store";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"; 
import type { FetchStatus } from "./fetchStatus";
import type { BusinessInfoData } from "../types/daoTypes";
import adminService from "../services/adminService";

interface UpdateBusinessInfo{
    originalBusinessInfo : BusinessInfoData,
    newBusinessInfo:BusinessInfoData,
}

const initialState: { 
    loadingFetch: boolean,
    fetchStatus: FetchStatus,
    fetchError: string | null;
    loadingUpdate: boolean,
    error: string | null
    info: BusinessInfoData | null
} = {
    loadingFetch: false,
    fetchStatus: "idle",
    fetchError: null,
    loadingUpdate: false,
    error: null,
    info: {
        id: "",
        phoneNumber: "",
        websiteUrl: "",
        emails: [],
        businessHours: [],
        siteMaintenance: false,
        address: "",
        addressPrecursor: "none",
        socialMedia: {},
    }
}

export const updateBusinessInfo = createAsyncThunk<BusinessInfoData, UpdateBusinessInfo>("businessInfo/updateBusinessInfo", async({newBusinessInfo, originalBusinessInfo}, thunkAPI)=>{
    try{
        const updatedInfo = await adminService.updateBusinessInfo(originalBusinessInfo, newBusinessInfo)
        if(updatedInfo){
            return newBusinessInfo;
        }else{
            throw new Error("Business Info was not updated");
        }
    }catch(err){
         let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update business info: ${errorMessage}`);
    }
})

export const fetchBusinessInfo = createAsyncThunk("businessInfo/fetchBusinessInfo", async(_, thunkAPI)=>{
    try{
        const businessInfo = await adminService.getBusinessInfo();
        if(!businessInfo){
            throw new Error ("No business info data was retrieved");
        }
        return businessInfo;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch business info: ${errorMessage}`);
    }
}, {
    condition: (_, { getState }) => !(getState() as RootState).businessInfo.loadingFetch,
})
const businessSlice = createSlice({
    name:"businessInfo",
    initialState,
    reducers: {
        clearBusinessInfo: (state)=>{
            state.loadingFetch = false;
            state.loadingUpdate = false;
            state.fetchStatus = "idle";
            state.info = null;
        },
        clearBusinessError: (state)=>{
            state.fetchError = null;
            state.error = null;
        }
    },
    extraReducers(builder) {
        builder
            .addCase(updateBusinessInfo.pending, (state)=>{
                state.loadingUpdate = true;
                state.error = null;
            })
            .addCase(updateBusinessInfo.fulfilled, (state, action)=>{
                state.loadingUpdate = false;
                state.info = action.payload
                state.error = null;
            })
            .addCase(updateBusinessInfo.rejected, (state, action)=>{
                state.loadingUpdate = false;
                state.error = action.payload as string;
            })    
            .addCase(fetchBusinessInfo.pending, (state)=>{
            state.fetchError = null;
                state.loadingFetch = true;
            state.fetchStatus = "loading";
                state.error = null;
            })
            .addCase(fetchBusinessInfo.fulfilled, (state, action)=>{
            state.fetchError = null;
                state.loadingFetch = false;
            state.fetchStatus = "succeeded";
                state.info = action.payload
                state.error = null;
            })
            .addCase(fetchBusinessInfo.rejected, (state, action)=>{
            state.fetchError = action.payload as string;
                state.loadingFetch = false;
            state.fetchStatus = "failed";
                state.error = action.payload as string;
            })    
    },
})

export const {clearBusinessInfo, clearBusinessError} = businessSlice.actions;
export default businessSlice.reducer;
