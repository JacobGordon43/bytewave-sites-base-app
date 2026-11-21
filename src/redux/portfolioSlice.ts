import type { RootState } from "./store";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import type { PortfolioData } from "../types/daoTypes";
import { portfolioAdapter } from "./adapters/portfolioAdapter";
import adminService from "../services/adminService";
import { uploadFilestoS3 } from "../utils/presignedHelper";
import {v4 as uuidv4} from "uuid"
interface UpdatePortfolio{
    originalPortfolio: PortfolioData,
    newPortfolio: PortfolioData
}

interface PortfolioState extends ReturnType<typeof portfolioAdapter.getInitialState>{
    loadingFetch: boolean;
    fetchStatus: FetchStatus;
    fetchError: string | null;
    loadingUpload: boolean;
    loadingDelete: boolean;
    error: string | null;
}

const initialState: PortfolioState = portfolioAdapter.getInitialState({
    loadingFetch: false,
    fetchStatus: "idle",
    fetchError: null,
    loadingUpload: false,
    loadingDelete: false,
    error: null
})

export const fetchPortfolio = createAsyncThunk("portfolio/fetchPortfolio", async(_, thunkAPI)=>{
    try{
        const portfolio = await adminService.getPortfolio()
        if(!portfolio){
            throw new Error("No portfolio data was retrieved")
        }
        return portfolio;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch portfolio: ${errorMessage}`);
    }
}, {
    // Read the current store synchronously: multiple hook consumers share one request.
    condition: (_, { getState }) => !(getState() as RootState).portfolio.loadingFetch,
})

export const deletePortfolio = createAsyncThunk<string, string>("portfolio/deletePortfolio", async(id, thunkAPI)=>{
    try{
        const deleted = await adminService.deletePortfolio(id);
        if(!deleted){
            return thunkAPI.rejectWithValue("Portfolio was not deleted");
        }
        return id;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to delete portfolio: ${errorMessage}`);
    }
})

export const createPortfolio = createAsyncThunk<PortfolioData, PortfolioData>("portfolio/createPortfolio", async(portfolioData, thunkAPI) => {
    try{
        const id = uuidv4();
        portfolioData.id = id;
        const file = {file: portfolioData.imageFile!, id}
        const fileData = {type: portfolioData.imageFile?.type!, id, size: portfolioData.imageFile?.size! };
        //Solve issue of passing File
        let presigned: {id: string, uploadUrl: string, key:string, fileUrl: string}[] = [];
        if(fileData){
            presigned = await adminService.uploadImages([fileData])
            const uploaded = await uploadFilestoS3(presigned, [file]);
            if(!uploaded){
                throw new Error("The portfolio image wasn't uploaded")
            }
        }
        portfolioData.imageFile = undefined;
        portfolioData.imageUrl = presigned[0]?.fileUrl;
        const newPortfolio = await adminService.createPortfolio(portfolioData);
        if(!newPortfolio){
            throw new Error("New Portfolio was undefined");
        }

        return newPortfolio
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to create portfolio: ${errorMessage}`)
    }
})

export const updatePortfolio = createAsyncThunk<PortfolioData, UpdatePortfolio>("portfolio/updatePortfolio", async({originalPortfolio, newPortfolio}, thunkAPI) => {
    try{
        const updatedPortfolio = await adminService.updatePortfolio(originalPortfolio, newPortfolio)
        
        if(updatedPortfolio){
            return newPortfolio;
        }else{
            throw new Error("Portfolio was not updated");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update portfolio: ${errorMessage}`)
    }
})

const portfolioSlice = createSlice({
    name: "portfolio",
    initialState, 
    reducers: {
        clearPortfolio(state){
            portfolioAdapter.removeAll(state);
            state.fetchStatus = "idle";
        },
        clearPortfolioError(state){
            state.fetchError = null;
            state.error = null
        }
    },
    extraReducers(builder){
        builder
        .addCase(fetchPortfolio.pending, (state)=>{
            state.fetchError = null;
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchPortfolio.fulfilled, (state, action)=>{
            state.fetchError = null;
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            portfolioAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchPortfolio.rejected, (state, action)=>{
            state.fetchError = action.payload as string;
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        .addCase(updatePortfolio.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(updatePortfolio.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            portfolioAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            })
            state.error = null;
        })
        .addCase(updatePortfolio.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(createPortfolio.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(createPortfolio.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            portfolioAdapter.addOne(state, action.payload)
            state.error = null;
        })
        .addCase(createPortfolio.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(deletePortfolio.pending, (state)=>{
            state.loadingDelete = true;
            state.error = null;
        })
        .addCase(deletePortfolio.fulfilled, (state, action)=>{
            state.loadingDelete = false;
            portfolioAdapter.removeOne(state, action.payload)
            state.error = null;
        })
        .addCase(deletePortfolio.rejected, (state, action)=>{
            state.loadingDelete = false;
            state.error = action.payload as string;
        })
    }
})

export const {clearPortfolioError: clearPortfolioError, clearPortfolio} = portfolioSlice.actions
export default portfolioSlice.reducer
