import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import type { WorkOrderData } from "../types/daoTypes";
import { workOrderAdapter } from "./adapters/workOrderAdapter";
import adminService from "../services/adminService";

interface UpdateWorkOrder{
    originalWorkOrder: WorkOrderData,
    newWorkOrder: WorkOrderData
}

interface WorkOrderState extends ReturnType<typeof workOrderAdapter.getInitialState>{
    loadingFetch: boolean;
    fetchStatus: FetchStatus;
    loadingUpload: boolean;
    loadingDelete: boolean;
    error: string | null;
}

const initialState: WorkOrderState = workOrderAdapter.getInitialState({
    loadingFetch: false,
    fetchStatus: "idle",
    loadingUpload: false,
    loadingDelete: false,
    error: null
})

export const fetchWorkOrders = createAsyncThunk("workOrder/fetchWorkOrders", async(_, thunkAPI)=>{
    try{
        const workOrder = await adminService.getWorkOrders()
        if(!workOrder){
            throw new Error("No Work Order data was retrieved")
        }
        return workOrder;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch Work Order: ${errorMessage}`);
    }
})

export const deleteWorkOrder = createAsyncThunk<string, WorkOrderData>("workOrder/deleteWorkOrder", async(WorkOrderData, thunkAPI)=>{
    try{
        const deleted = await adminService.deleteWorkOrder(WorkOrderData.id);
        if(!deleted){
            return thunkAPI.rejectWithValue("Work Order was not deleted");
        }
        return WorkOrderData.id;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to delete Work Order: ${errorMessage}`);
    }
})

export const createWorkOrder = createAsyncThunk<WorkOrderData, WorkOrderData>("workOrder/createWorkOrder", async(workOrderData, thunkAPI) => {
    try{
        const newWorkOrder = await adminService.createWorkOrder(workOrderData);
        if(!newWorkOrder){
            throw new Error("New Work Order was undefined");
        }

        return newWorkOrder
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to create Work Order: ${errorMessage}`)
    }
})

export const updateWorkOrder = createAsyncThunk<WorkOrderData, UpdateWorkOrder>("workOrder/updateWorkOrder", async({originalWorkOrder, newWorkOrder}, thunkAPI) => {
    try{
        const updatedWorkOrder = await adminService.updateWorkOrder(originalWorkOrder, newWorkOrder)
        if(updatedWorkOrder){
            return newWorkOrder;
        }else{
            throw new Error("WorkOrder was not updated");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update Work Order: ${errorMessage}`)
    }
})

const workOrderSlice = createSlice({
    name: "workOrder",
    initialState, 
    reducers: {
        clearWorkOrder(state){
            workOrderAdapter.removeAll(state);
            state.fetchStatus = "idle";
        },
        clearWorkOrderError(state){
            state.error = null
        },
        resetWorkOrderSlice: () => initialState,
    },
    extraReducers(builder){
        builder
        .addCase(fetchWorkOrders.pending, (state)=>{
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchWorkOrders.fulfilled, (state, action)=>{
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            workOrderAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchWorkOrders.rejected, (state, action)=>{
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        .addCase(updateWorkOrder.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(updateWorkOrder.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            workOrderAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            })
            state.error = null;
        })
        .addCase(updateWorkOrder.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(createWorkOrder.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(createWorkOrder.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            workOrderAdapter.addOne(state, action.payload)
            state.error = null;
        })
        .addCase(createWorkOrder.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(deleteWorkOrder.pending, (state)=>{
            state.loadingDelete = true;
            state.error = null;
        })
        .addCase(deleteWorkOrder.fulfilled, (state, action)=>{
            state.loadingDelete = false;
            workOrderAdapter.removeOne(state, action.payload)
            state.error = null;
        })
        .addCase(deleteWorkOrder.rejected, (state, action)=>{
            state.loadingDelete = false;
            state.error = action.payload as string;
        })
    }
})

export const {clearWorkOrderError, clearWorkOrder, resetWorkOrderSlice} = workOrderSlice.actions
export default workOrderSlice.reducer
