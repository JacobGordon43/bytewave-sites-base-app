import { createAsyncThunk, createSlice, type PayloadAction} from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import type { HostingData } from "../types/daoTypes";
import adminService from "../services/adminService";
import { hostingAdapter } from "./adapters/hostingAdapter";
export const fetchHostingData = createAsyncThunk("hosting/fetchHostingData", async(_, thunkAPI)=>{
    try{
        const hosting = await adminService.getHosting();

        if(!hosting){
            return [];
        }
        return hosting;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch hosting data: ${errorMessage}`);
    }
})

export const fetchHostingDataById = createAsyncThunk("hosting/fetchHostingDataById", async(clientId:string, thunkAPI) => {
    try{
        if(!clientId){
            return thunkAPI.rejectWithValue("No clientId provided");
        }

        const hosting = await adminService.getHostingById(clientId);

        if(!hosting){
            return thunkAPI.rejectWithValue("No hosting data was retrieved");
        }
        return {hosting, clientId};
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch hosting data: ${errorMessage}`);
    }
})
export const createHostingData = createAsyncThunk<HostingData, FormData>("hosting/createHostingData", async(formData, thunkAPI)=>{
    try{
        const newData = await adminService.createHosting(formData);
        if(!newData){
            throw new Error("New Hosting Data was undefined.")
        }
        return newData;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred.";
        }
        return thunkAPI.rejectWithValue(`Failed to create hosting data. ${errorMessage}`);
    }
})

export const updateHostingData = createAsyncThunk<HostingData, {originalHosting: HostingData, newHosting: HostingData}>("hosting/updateHostingData", async ({originalHosting, newHosting}, thunkAPI)=>{
    try{
        const updatedData = await adminService.updateHosting(originalHosting, newHosting);
        if(updatedData){
            return newHosting;
        }else{
            throw new Error("Hosting data was not updated.")
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred.";
        }
        return thunkAPI.rejectWithValue(`Failed to update hosting data. ${errorMessage}`);
    }
})

interface HostingState extends ReturnType<typeof hostingAdapter.getInitialState>{
    clientHostingFetched: Record<string, boolean>
    loadingFetch: boolean,
    fetchStatus: FetchStatus,
    loadingCreate: boolean,
    error: string | null
}

const initialState:HostingState = hostingAdapter.getInitialState({
    clientHostingFetched:{} as Record<string, boolean>,
    loadingFetch: false,
    fetchStatus: "idle",
    loadingCreate: false,
    error: null
})

const hostingSlice = createSlice({
    name:"hosting",
    initialState,
    reducers: {
        clearHosting(state){
            hostingAdapter.removeAll(state);
            state.fetchStatus = "idle";
        },
        clearHostingError(state){
            state.error = null;
        },
        resetHostingSlice: () => initialState,
        setHostingError(state, action : PayloadAction<string>){
            state.error = action.payload;
        }
    },
    extraReducers(buidler){
        buidler
        //Getting hosting data
        .addCase(fetchHostingData.pending, (state) => {
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchHostingData.fulfilled, (state, action: PayloadAction<HostingData[]>) => {
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            hostingAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchHostingData.rejected, (state, action) => {
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })  
        //Getting hosting data by client
        .addCase(fetchHostingDataById.pending, (state) => {
            state.loadingFetch = true;
            state.error = null;
        })
        .addCase(fetchHostingDataById.fulfilled, (state, action: PayloadAction<{hosting:HostingData[], clientId: string}>) => {
            state.loadingFetch = false;
            const {hosting, clientId} = action.payload;
            state.clientHostingFetched[clientId] = true;
            hostingAdapter.upsertMany(state, hosting)
            state.error = null;
        })
        .addCase(fetchHostingDataById.rejected, (state, action) => {
            state.loadingFetch = false;
            state.error = action.payload as string;
        })  
        //Creating hosting data
        .addCase(createHostingData.pending, (state) => {
            state.loadingCreate = true;
            state.error = null;
        })
        .addCase(createHostingData.fulfilled, (state, action: PayloadAction<HostingData>) => {
            state.loadingCreate = false;
            const hostingData = action.payload;
            hostingAdapter.addOne(state, hostingData);
            state.error = null;
        })
        .addCase(createHostingData.rejected, (state, action) => {
            state.loadingCreate = false;
            state.error = action.payload as string;
        })    
        //Updating hosting data
        .addCase(updateHostingData.pending, (state) => {
            state.loadingCreate = true;
            state.error = null;
        })
        .addCase(updateHostingData.fulfilled, (state, action: PayloadAction<HostingData>) => {
            state.loadingCreate = false;
            hostingAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            })
            state.error = null;
        })
        .addCase(updateHostingData.rejected, (state, action) => {
            state.loadingCreate = false;
            state.error = action.payload as string;
        })    
    }
})

export const {clearHosting, clearHostingError, resetHostingSlice, setHostingError} = hostingSlice.actions;
export default hostingSlice.reducer;
