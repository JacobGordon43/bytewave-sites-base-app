import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import adminService from "../services/adminService";
import { type FormAndUserData, type CreateMessageData, type MessageData, type TicketData } from "../types/daoTypes";
import { ticketsAdapter } from "./adapters/ticketsAdapter";
import type { RootState } from "./store";
import { selectClientById } from "./selectors/clientsSelector";

interface UpdateTicket{
    originalTicket : TicketData,
    newTicket:TicketData,
}

export const fetchTickets = createAsyncThunk("tickets/fetchTickets", async (_, thunkAPI)=>{
    try{
        const tickets = await adminService.getWorkingTickets();
        if(!tickets){
            throw new Error("No ticket data was retrieved");
        }
        return tickets.sort((a, b) => Number(b.dateCreated) - Number(a.dateCreated));
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch tickets: ${errorMessage}`);
    }
})

export const fetchTicketById = createAsyncThunk<TicketData, string>(
    "tickets/fetchTicketById",
    async (ticketId, thunkAPI) => {
        try {
            if (!ticketId) {
                throw new Error("No ticket ID was provided.");
            }

            const ticket = await adminService.getTicketById(ticketId);
            if (!ticket) {
                throw new Error("The ticket was not found.");
            }

            return ticket;
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : "Unknown error occurred";
            return thunkAPI.rejectWithValue(`Failed to fetch ticket: ${errorMessage}`);
        }
    },
)

export const fetchAllTicketsByClient = createAsyncThunk("tickets/fetchAllTicketsByClient", async(clientId:string, thunkAPI)=>{
    try{
        if(!clientId){
            return thunkAPI.rejectWithValue("No clientId provided");
        }
        const tickets = await adminService.getTicketsById(clientId);
        if(!tickets){
            return thunkAPI.rejectWithValue("No ticket data was retrieved");
        }
        //let sortedTickets = tickets.sort((a,b)=> Number(b.dateCreated) - Number(a.dateCreated));
        return {clientId, tickets}
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch tickets: ${errorMessage}`);
    }
})

export const fetchTicketMessages = createAsyncThunk<MessageData[], string>("tickets/fetchTicketMessages", async(ticketId, thunkAPI) =>{
    try{
        const messages = await adminService.getTicketMessages(ticketId);
        if(!messages){
            throw new Error("No message data was retrieved");
        }
        return messages;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch messages: ${errorMessage}`);
    }
})

export const createTicket = createAsyncThunk<TicketData, FormAndUserData>("tickets/createTicket", async(formData, thunkAPI) =>{
  try{
    const newTicket = await adminService.createTicket(formData);

    if(!newTicket){
        throw new Error("New Ticket was undefined.")
    }

    return newTicket;
  }catch(err){
    let errorMessage;
    if(err instanceof Error){
        errorMessage = err.message;
    }else{
        errorMessage = "Unknown error occurred.";
    }
    return thunkAPI.rejectWithValue(`Failed to create a ticket. ${errorMessage}`);
  } 
})

export const updateTicket = createAsyncThunk<TicketData, UpdateTicket>("tickets/updateTicket", async({originalTicket, newTicket }, thunkAPI)=>{
    try{
        const updatedTicket = await adminService.updateTicket(originalTicket, newTicket);
        if(updatedTicket){
            return newTicket;
        }else{
            throw new Error("Ticket was not updated");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update ticket: ${errorMessage}`);
    }
})

export const fetchTicketsAfterDate = createAsyncThunk<TicketData[], number>("tickets/fetchTicketsAfterDate", async(lastFetched, thunkAPI)=>{
    try{
        const tickets = await adminService.getTicketsAfterDate(lastFetched);
        if(!tickets){
            return thunkAPI.rejectWithValue("Failed to fetch tickets.")
        }

        return tickets.sort((a, b) => Number(b.dateCreated) - Number(a.dateCreated));
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch tickets after ${new Date(lastFetched).toDateString()}: ${errorMessage}`)
    }
})

export const createMessage = createAsyncThunk<MessageData, CreateMessageData>("tickets/createMessage", async(message, thunkAPI) =>{
  try{
    let clientName;
    let clientEmail;
    if(message.from === "support"){
        const state = thunkAPI.getState() as RootState;
        const client = selectClientById(state, message.clientId)
            ?? await adminService.getClientById(message.clientId);
        if(!client){
            throw new Error("The client associated with this ticket was not found.");
        }
        clientEmail = client.businessEmail;
        clientName = client.clientFirstName;
    }

    const newMessage = await adminService.createMessage(message, {clientName, clientEmail});

    if(!newMessage){
        throw new Error("New Message was undefined.")
    }

    return newMessage;
  }catch(err){
    let errorMessage;
    if(err instanceof Error){
        errorMessage = err.message;
    }else{
        errorMessage = "Unknown error occurred.";
    }
    return thunkAPI.rejectWithValue(`Failed to create message. ${errorMessage}`);
  } 
})
// export const ticketsAdapter = createEntityAdapter({
//     selectId: (ticket : TicketData) => ticket.id,
//     sortComparer: (a, b) => b.dateCreated - a.dateCreated
// })
interface TicketState extends ReturnType<typeof ticketsAdapter.getInitialState>{
    clientHistoryFetched: Record<string, boolean>,
    loadingFetch: boolean;
    fetchStatus: FetchStatus;
    loadingAdditionalFetch: boolean;
    loadingCreate: boolean;
    loadingSendMessage: boolean;
    error: string | null;
}
const initialState:TicketState = ticketsAdapter.getInitialState({
    clientHistoryFetched: {} as Record<string, boolean>, //{clientId: boolean}
    loadingFetch: false,
    fetchStatus: "idle",
    loadingAdditionalFetch: false,
    loadingCreate: false,
    loadingSendMessage: false,
    error: null,
})

const ticketsSlice = createSlice({
    name: "tickets",
    initialState,
    reducers: {
        clearTickets(state){
            ticketsAdapter.removeAll(state)
            state.fetchStatus = "idle";
        },
        resolveStatus(state, action: PayloadAction<string>){
            ticketsAdapter.updateOne(state, {
                id: action.payload,
                changes: {
                    status: "Resolved"
                }
            })
        },
        clearTicketError(state){
            state.error = null;
        },
        resetTicketSlice: () => initialState,
    },
    extraReducers(builder) {
        builder
        //Fetching tickets
        .addCase(fetchTickets.pending, (state) => {
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchTickets.fulfilled, (state, action: PayloadAction<TicketData[]>) => {
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            ticketsAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchTickets.rejected, (state, action) => {
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        // Fetching one ticket by ID intentionally does not change fetchStatus.
        .addCase(fetchTicketById.pending, (state) => {
            state.error = null;
        })
        .addCase(fetchTicketById.fulfilled, (state, action: PayloadAction<TicketData>) => {
            ticketsAdapter.upsertOne(state, action.payload);
            state.error = null;
        })
        .addCase(fetchTicketById.rejected, (state, action) => {
            state.error = action.payload as string;
        })
        //Fetching tickets after date
        .addCase(fetchTicketsAfterDate.pending, (state) => {
            state.loadingFetch = true;
            state.error = null;
        })
        .addCase(fetchTicketsAfterDate.fulfilled, (state, action: PayloadAction<TicketData[]>) => {
            state.loadingFetch = false;
            ticketsAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchTicketsAfterDate.rejected, (state, action) => {
            state.loadingFetch = false;
            state.error = action.payload as string;
        })      
        // Fetching tickets by client ID
        .addCase(fetchAllTicketsByClient.pending, (state) => {
            state.loadingFetch = true;
            state.error = null;
            state.fetchStatus = "loading";
        })
        .addCase(fetchAllTicketsByClient.fulfilled, (state, action: PayloadAction<{clientId: string, tickets: TicketData[]}>) => {
            const {clientId, tickets} = action.payload
            state.loadingFetch = false;
            ticketsAdapter.upsertMany(state, tickets)
            state.clientHistoryFetched[clientId] = true
            state.error = null;
            state.fetchStatus = "succeeded";
        })
        .addCase(fetchAllTicketsByClient.rejected, (state, action) => {
            state.loadingFetch = false;
            state.error = action.payload as string;
            state.fetchStatus = "failed";
        })
        //Creating Tickets
        .addCase(createTicket.pending, (state) => {
            state.loadingCreate = true;
            state.error = null;
        })
        .addCase(createTicket.fulfilled, (state, action: PayloadAction<TicketData>) => {
            state.loadingCreate = false;
            const ticket = action.payload;
            ticketsAdapter.addOne(state, ticket);
            state.error = null;
        })
        .addCase(createTicket.rejected, (state, action) => {
            state.loadingCreate = false;
            state.error = action.payload as string;
        })    
        //Update Tickets
        .addCase(updateTicket.pending, (state) => {
            state.loadingCreate = true;
            state.error = null;
        })
        .addCase(updateTicket.fulfilled, (state, action: PayloadAction<TicketData>) => {
            state.loadingCreate = false;
            ticketsAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            })
            state.error = null;
        })
        .addCase(updateTicket.rejected, (state, action) => {
            state.loadingCreate = false;
            state.error = action.payload as string;
        })    
        //Creating messages
        .addCase(createMessage.pending, (state) => {
            state.loadingSendMessage = true;
            state.error = null;
        })
        .addCase(createMessage.fulfilled, (state, action: PayloadAction<MessageData>) => {
            state.loadingSendMessage = false;
            let ticketMessages = state.entities[action.payload.chatId].messages ?? [];
            // ticketMessages?.push(action.payload);
            // const partialTicket : Partial<TicketData> = {
            //     messages: ticketMessages
            // }
            ticketsAdapter.updateOne(state, {
                id: action.payload.chatId,
                changes: {
                    messages: [...ticketMessages, action.payload]
                }
            })
            state.error = null;
        })
        .addCase(createMessage.rejected, (state, action) => {
            state.loadingSendMessage = false;
            state.error = action.payload as string;
        })  
        //Get ticket messages
        .addCase(fetchTicketMessages.pending, (state) => {
            state.loadingAdditionalFetch = true;
            state.error = null;
        })
        .addCase(fetchTicketMessages.fulfilled, (state, action: PayloadAction<MessageData[]>) => {
            state.loadingAdditionalFetch = false;

            if(action.payload.length > 0){
                ticketsAdapter.updateOne(state, {
                    id: action.payload[0].chatId,
                    changes: {
                        messages: action.payload
                    }
                })
            }
            state.error = null;
        })
        .addCase(fetchTicketMessages.rejected, (state, action) => {
            state.loadingAdditionalFetch = false;
            state.error = action.payload as string;
        })   

    }
})
export const {clearTickets, clearTicketError, resetTicketSlice, resolveStatus} = ticketsSlice.actions
export default ticketsSlice.reducer;
