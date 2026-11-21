import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import adminService from "../services/adminService";
import type { PaymentData } from "../types/daoTypes";
import { paymentsAdapter } from "./adapters/paymentsAdapter";
//If an admin is signed in, all payments will be retrieved. 
// If a client is signed in, only their payments will be retrieved.
export const fetchPayments = createAsyncThunk("payments/fetchPayments", async (_, thunkAPI) => {
    try{
        const payments = await adminService.getPayments();
        return payments;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else {
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch payments: ${errorMessage}`)
    }
});

export const createPayment = createAsyncThunk<PaymentData, FormData>("payments/createPayment", async (formData, thunkAPI) =>{
    try{
        const newPayment = await adminService.createPayment(formData)
        if(!newPayment){
            return thunkAPI.rejectWithValue("Payment not created.");
        }

        return newPayment;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else {
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to create payment data: ${errorMessage}`);
    }
})

export const fetchPaymentsById = createAsyncThunk("payments/fetchPaymentsById", async (clientId : string, thunkAPI)=>{
    try{
        const payments = await adminService.getPaymentsById(clientId) 
        return payments;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else {
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch payment data: ${errorMessage}`);
    }
})

export const deletePaymentData = createAsyncThunk<string, PaymentData>("payments/deletePaymentData", async(paymentData, thunkAPI)=>{
    try{
        const deleted = await adminService.deletePayment(paymentData.id);

        if(!deleted){
            return thunkAPI.rejectWithValue("Payment was not deleted");
        }

        return paymentData.id;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to delete payment: ${errorMessage}`);
    }
})

export const updatePayment = createAsyncThunk<PaymentData, {originalPayment: PaymentData, newPayment: PaymentData}>("payments/updatePayment", async({originalPayment, newPayment}, thunkAPI)=>{
    try{
        const updatedPayment = await adminService.updatePayment(originalPayment, newPayment);
        if(originalPayment.platform === "Stripe") throw new Error("You can not change the data of a Stripe payment");
        if(updatedPayment){
            return updatedPayment;
        }else{
            throw new Error("Payment was not updated");
        }
    }catch(err){
         let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update payment: ${errorMessage}`);
    }
})

interface PaymentState extends ReturnType<typeof paymentsAdapter.getInitialState>{
    loadingFetch: boolean,
    fetchStatus: FetchStatus,
    loadingUpload: boolean,
    loadingDelete: boolean,
    error: string | null
}

const initialState: PaymentState = paymentsAdapter.getInitialState({
    payments: [],
    loadingFetch: true,
    fetchStatus: "idle",
    loadingUpload: false,
    loadingDelete: false,
    error: null
});

const paymentSlice = createSlice({
    name: "payments",
    initialState,
    reducers: {
        clearPayments(state){
            state.fetchStatus = "idle";
        },
        clearPaymentError(state){
            state.error = null;
        },
        resetPaymentSlice: () => initialState,
    },
extraReducers: (builder) => {
    builder
        .addCase(fetchPayments.pending, (state) => {
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchPayments.fulfilled, (state, action: PayloadAction<PaymentData[]>) => {
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            paymentsAdapter.upsertMany(state, action.payload);
        })
        .addCase(fetchPayments.rejected, (state, action) => {
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        .addCase(fetchPaymentsById.pending, (state) => {
            state.loadingFetch = true;
            state.error = null;
        })
        .addCase(fetchPaymentsById.fulfilled, (state, action: PayloadAction<PaymentData[]>) => {
            state.loadingFetch = false;
            //state.payments = action.payload;
            paymentsAdapter.upsertMany(state, action.payload)
        })
        .addCase(fetchPaymentsById.rejected, (state, action) => {
            state.loadingFetch = false;
            state.error = action.payload as string;
        })
        .addCase(createPayment.pending, (state) => {
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(createPayment.fulfilled, (state, action: PayloadAction<PaymentData>) => {
            state.loadingUpload = false;
            paymentsAdapter.upsertOne(state, action.payload)
        })
        .addCase(createPayment.rejected, (state, action) => {
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(deletePaymentData.pending, (state) => {
            state.loadingDelete = true;
            state.error = null;
        })
        .addCase(deletePaymentData.fulfilled, (state, action) => {
            state.loadingDelete = false;
            paymentsAdapter.removeOne(state, action.payload);
        })
        .addCase(deletePaymentData.rejected, (state, action) => {
            state.loadingDelete = false;
            state.error = action.payload as string;
        })
        .addCase(updatePayment.pending, (state) => {
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(updatePayment.fulfilled, (state, action) => {
            state.loadingUpload = false;
            paymentsAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            });
        })
        .addCase(updatePayment.rejected, (state, action) => {
            state.loadingUpload = false;
            state.error = action.payload as string;
        });

    }
})

export const {clearPayments, clearPaymentError, resetPaymentSlice} = paymentSlice.actions;
export default paymentSlice.reducer;
