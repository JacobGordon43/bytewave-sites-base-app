import { createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import adminService from "../services/adminService";
import type { ClientData } from "../types/daoTypes";
import { clientAdapter } from "./adapters/clientAdapter";

export const fetchClients = createAsyncThunk('clients/fetchClients', async (_, thunkAPI) => {
    try{
        const clients = await adminService.getClients();
        return clients;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch clients: ${errorMessage}`);
    }
})

export const createClient = createAsyncThunk<ClientData, FormData>("clients/createClient", 
    async (formData, thunkAPI) =>{
        try{
            const newClient = await adminService.createClient(formData);
            if(!newClient){
                throw new Error("New client was undefined.")
            }
            return newClient;
        }catch(err){
            let errorMessage;
            if(err instanceof Error){
                errorMessage = err.message;
            }else{
                errorMessage = "Unknown error occurred.";
            }
            return thunkAPI.rejectWithValue(`Failed to create client. ${errorMessage}`);
        }
    }
)

export const updateClient = createAsyncThunk<ClientData, {originalClient: ClientData, newClient: ClientData}>("clients/updateClient", async ({originalClient, newClient}, thunkAPI)=>{
    try{

        const updatedClient = await adminService.updateClient(originalClient, newClient);

        if(updatedClient){
            return newClient;
        }else{
            throw new Error("Client was not updated");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update client: ${errorMessage}`);
    }
})

export const fetchClientById = createAsyncThunk<ClientData, string>("clients/fetchClientById", async (clientId, thunkAPI)=>{
    try{
        const ticket = await adminService.getClientById(clientId);
        if(ticket){
            return ticket;
        }else{
            throw new Error("Client was not found");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch client: ${errorMessage}`);
    }
})

interface ClientState extends ReturnType<typeof clientAdapter.getInitialState> {
    loadingFetch: boolean,
    fetchStatus: FetchStatus,
    loadingUpload: boolean,
    error: string | null
}

const initialState: ClientState  = clientAdapter.getInitialState({
    clients: [],
    loadingFetch: false,
    fetchStatus: "idle",
    loadingUpload: false,
    error: null
});


const clientSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {
    clearClients(state) {
      clientAdapter.removeAll(state);
            state.fetchStatus = "idle";
    },
    clearClientError(state) {
      state.error = null;
    },
    resetClientSlice: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loadingFetch = true;
            state.fetchStatus = "loading";
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loadingFetch = false;
            state.fetchStatus = "succeeded";
        clientAdapter.setAll(state, action.payload);
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loadingFetch = false;
            state.fetchStatus = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchClientById.pending, (state) => {
        state.loadingFetch = true;
        state.fetchStatus = "loading";
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loadingFetch = false;
            state.fetchStatus = "succeeded";
        clientAdapter.setOne(state, action.payload);
        state.error = null;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loadingFetch = false;
            state.fetchStatus = "failed";
        state.error = action.payload as string;
      })
      .addCase(createClient.pending, (state) => {
        state.loadingUpload = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.loadingUpload = false;
        clientAdapter.addOne(state, action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loadingUpload = false;
        state.error = action.payload as string;
      })
      .addCase(updateClient.pending, (state) => {
        state.loadingUpload = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.loadingUpload = false;

        clientAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload
        });

        state.error = null;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.loadingUpload = false;
        state.error = action.payload as string;
      });
  }
});

export const {clearClients, clearClientError, resetClientSlice} = clientSlice.actions
export default clientSlice.reducer;
