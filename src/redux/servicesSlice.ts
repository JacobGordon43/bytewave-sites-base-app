import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import type { FormAndUserData, ServiceData } from "../types/daoTypes";
import { servicesAdapter } from "./adapters/servicesAdapter";
import adminService from "../services/adminService";
import type { RootState } from "./store";
import { selectServices } from "./selectors/servicesSelector";

interface UpdateService{
    originalService: ServiceData,
    newService: ServiceData
}

interface ServiceState extends ReturnType<typeof servicesAdapter.getInitialState>{
    loadingFetch: boolean;
    fetchStatus: FetchStatus;
    fetchError: string | null;
    loadingUpload: boolean;
    loadingDelete: boolean;
    error: string | null;
}

const initialState: ServiceState = servicesAdapter.getInitialState({
    loadingFetch: false,
    fetchStatus: "idle",
    fetchError: null,
    loadingUpload: false,
    loadingDelete: false,
    error: null
})

//Deep compare to help test primitive types, objects, and values
const isEqual = (a:any, b:any) : boolean=>{
    if (a === b) return true;

    if(Array.isArray(a) && Array.isArray(b)){
        if(a.length !== b.length) return false;
        return a.every((value, index) => isEqual(value, b[index]))
    }

    if(typeof a === "object" && typeof b === "object" && a && b){
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if(keysA.length !== keysB.length) return false;
        return keysA.every(key=>isEqual(a[key], b[key]));
    }

    return false
}

const hasChanged = (
  draftSection: ServiceData,
  reduxSection: ServiceData
) => {
  const allKeys = new Set([
    ...Object.keys(reduxSection),
    ...Object.keys(draftSection)
  ]) as Set<keyof ServiceData>;

  for (const key of allKeys) {
    if (!isEqual(reduxSection[key], draftSection[key])) {
      return true;
    }
  }

  return false;
}

// const hasChanged = (draftSection:ServiceData, reduxSection:ServiceData)=>{
//     for(const key of Object.keys(reduxSection) as (keyof ServiceData)[]){
//         const originalValue = reduxSection[key];
//         const newValue = draftSection[key];

//         if(newValue !== undefined && !isEqual(originalValue, newValue)){
//             return true;
//         }
//     }
//     return false;
// }


export const saveServices = createAsyncThunk("services/saveServices", async(services:ServiceData[], thunkAPI)=>{
    try{
        let servicesToSave : ServiceData[] = [];
        let servicesToDelete : string[] = [];
        const draftCopy = structuredClone(services);
        const currentState = thunkAPI.getState() as RootState
        const reduxSections = selectServices(currentState)
        
        draftCopy?.map((s, index) => {
            s.index = index;
            const matchedSection = reduxSections.find(section => section.id === s.id)
            //Detects new sections & adds it to the sectionsToSave array array
            if(!matchedSection){
                servicesToSave.push(s);
            }else if(hasChanged(s, matchedSection!)){
                servicesToSave.push(s);
            }
        });

        reduxSections?.map(section => {
            const found = draftCopy.find(s=>s.id ===section.id)
            if(!found){
                servicesToDelete.push(section.id);
            }
        });


        const saved = await adminService.uploadServices(servicesToSave, servicesToDelete);
        if(saved){
            return draftCopy
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to save services: ${errorMessage}`);
        
    }
})
export const fetchServices = createAsyncThunk("services/fetchServices", async(_, thunkAPI)=>{
    try{
        const services = await adminService.getServices()
        if(!services){
            throw new Error("No service data was retrieved")
        }
        return services.sort((a,b)=>b.index - a.index )
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch services: ${errorMessage}`);
    }
}, {
    // Read the current store synchronously: multiple hook consumers share one request.
    condition: (_, { getState }) => !(getState() as RootState).services.loadingFetch,
})

export const deleteService = createAsyncThunk<string, ServiceData>("services/deleteService", async(serviceData, thunkAPI)=>{
    try{
        const deleted = await adminService.deleteService(serviceData.id);
        if(!deleted){
            return thunkAPI.rejectWithValue("Service was not deleted");
        }
        return serviceData.id;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to delete service: ${errorMessage}`);
    }
})

export const createService = createAsyncThunk<ServiceData, FormAndUserData>("services/createService", async(formData, thunkAPI) => {
    try{
        const newService = await adminService.createService(formData);

        if(!newService){
            throw new Error("New Section was undefined");
        }

        return newService
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to create service: ${errorMessage}`)
    }
})

export const updateService = createAsyncThunk<ServiceData, UpdateService>("services/updateService", async({originalService, newService}, thunkAPI) => {
    try{
        const updatedService = await adminService.updateService(originalService, newService)

        if(updatedService){
            return newService;
        }else{
            throw new Error("Service was not updated");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update service: ${errorMessage}`)
    }
})
// export const deleteAboutSection = createAsyncThunk<ServiceData, ServiceData>("about/deleteAboutSection", async(serviceData, thunkAPI)=>{
//     try{
//         let deleted = await adminService.deleteService(serviceData.id);
//         if(!deleted){
//             return thunkAPI.rejectWithValue("About Service was not deleted.");
//         }
//         return serviceData;
//     }catch(err){
//         let errorMessage;
//         if(err instanceof Error){
//             errorMessage = err.message;
//         }else{
//             errorMessage = "Unknown error occurred";
//         }

//         return thunkAPI.rejectWithValue(`Failed to delete service: ${errorMessage}`)
//     }
// })

const servicesSlice = createSlice({
    name: "services",
    initialState, 
    reducers: {
        clearServices(state){
            servicesAdapter.removeAll(state);
            state.fetchStatus = "idle";
        },
        clearServiceError(state){
            state.fetchError = null;
            state.error = null
        }
    },
    extraReducers(builder){
        builder
        .addCase(fetchServices.pending, (state)=>{
            state.fetchError = null;
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchServices.fulfilled, (state, action)=>{
            state.fetchError = null;
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            servicesAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchServices.rejected, (state, action)=>{
            state.fetchError = action.payload as string;
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        .addCase(saveServices.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(saveServices.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            servicesAdapter.setAll(state, action.payload!)
            state.error = null;
        })
        .addCase(saveServices.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(updateService.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(updateService.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            servicesAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            })
            state.error = null;
        })
        .addCase(updateService.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(createService.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(createService.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            servicesAdapter.addOne(state, action.payload)
            state.error = null;
        })
        .addCase(createService.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(deleteService.pending, (state)=>{
            state.loadingDelete = true;
            state.error = null;
        })
        .addCase(deleteService.fulfilled, (state, action)=>{
            state.loadingDelete = false;
            servicesAdapter.removeOne(state, action.payload)
            state.error = null;
        })
        .addCase(deleteService.rejected, (state, action)=>{
            state.loadingDelete = false;
            state.error = action.payload as string;
        })
    }
})

export const {clearServiceError, clearServices} = servicesSlice.actions
export default servicesSlice.reducer
