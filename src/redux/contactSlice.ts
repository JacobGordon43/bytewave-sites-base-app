import type { RootState } from "./store";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import type { Submission } from "../types/daoTypes";
import { contactAdapter } from "./adapters/contactAdapter";
import adminService from "../services/adminService";

interface WorkOrderState extends ReturnType<typeof contactAdapter.getInitialState>{
    loadingFetch: boolean;
    fetchStatus: FetchStatus;
    fetchError: string | null;
    loadingUpload: boolean;
    loadingDelete: boolean;
    error: string | null;
}

const initialState: WorkOrderState = contactAdapter.getInitialState({
    loadingFetch: false,
    fetchStatus: "idle",
    fetchError: null,
    loadingUpload: false,
    loadingDelete: false,
    error: null
})

export const fetchContactSubmissions = createAsyncThunk("contactSubmissions/fetchContactSubmissions", async(_, thunkAPI)=>{
    try{
        const submissions = await adminService.getContactSubmissions()
        if(!submissions){
            throw new Error("No contact data was retrieved")
        }
        return submissions;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch Contact Submissions: ${errorMessage}`);
    }
}, {
    condition: (_, { getState }) => !(getState() as RootState).contact.loadingFetch,
})

export const createContactSubmission = createAsyncThunk<boolean, FormData>("contactSubmissions/createContactSubmission", async(formData, thunkAPI) =>{
    try{
        const token = formData.get("cf-turnstile-response");
        if(typeof token !== "string" || !token.trim()){
            throw new Error("Please complete the verification.")
        }
        const results = await adminService.createContactSubmission(formData)
        if(!results.success){
            throw new Error(`The contact Submission was not successful: ${results.message ? results.message : "An unknown error occurred"}`,)
        }

        return results.success;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to create Contact Submission: ${errorMessage}`);
    }
})

export const deleteContactSubmission = createAsyncThunk<string, Submission>("contactSubmissions/deleteContactSubmission", async(submission, thunkAPI)=>{
    try{
        const deleted = await adminService.deleteContactSubmission(submission.id);
        if(!deleted){
            return thunkAPI.rejectWithValue("Contact Submission was not deleted");
        }
        return submission.id;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to delete Contact Submission: ${errorMessage}`);
    }
})

const contactSlice = createSlice({
    name: "contactSubmissions",
    initialState, 
    reducers: {
        clearContactSubmissions(state){
            contactAdapter.removeAll(state);
            state.fetchStatus = "idle";
        },
        clearContactError(state){
            state.fetchError = null;
            state.error = null
        },
        resetContactSlice: () => initialState,
    },
    extraReducers(builder){
        builder
        .addCase(fetchContactSubmissions.pending, (state)=>{
            state.fetchError = null;
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchContactSubmissions.fulfilled, (state, action)=>{
            state.fetchError = null;
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            contactAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchContactSubmissions.rejected, (state, action)=>{
            state.fetchError = action.payload as string;
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        .addCase(deleteContactSubmission.pending, (state)=>{
            state.loadingDelete = true;
            state.error = null;
        })
        .addCase(deleteContactSubmission.fulfilled, (state, action)=>{
            state.loadingDelete = false;
            contactAdapter.removeOne(state, action.payload)
            state.error = null;
        })
        .addCase(deleteContactSubmission.rejected, (state, action)=>{
            state.loadingDelete = false;
            state.error = action.payload as string;
        })
        .addCase(createContactSubmission.pending, (state)=>{
            state.loadingUpload = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(createContactSubmission.fulfilled, (state)=>{
            state.loadingUpload = false;
            state.fetchStatus = "succeeded";
            state.error = null;
        })
        .addCase(createContactSubmission.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
    }
})

export const {clearContactError, clearContactSubmissions, resetContactSlice} = contactSlice.actions
export default contactSlice.reducer
