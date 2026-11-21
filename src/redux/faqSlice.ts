import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import type { FAQSectionData, FormAndUserData } from "../types/daoTypes";
import { faqAdapter } from "./adapters/faqAdapter";
import adminService from "../services/adminService";
import type { RootState } from "./store";
import { selectFAQSections } from "./selectors/faqSelector";

interface UpdateFAQ{
    originalFAQSection: FAQSectionData,
    newFAQSection: FAQSectionData
}

interface ServiceState extends ReturnType<typeof faqAdapter.getInitialState>{
    loadingFetch: boolean;
    fetchStatus: FetchStatus;
    fetchError: string | null;
    loadingUpload: boolean;
    loadingDelete: boolean;
    error: string | null;
}

const initialState: ServiceState = faqAdapter.getInitialState({
    loadingFetch: false,
    fetchStatus: "idle",
    fetchError: null,
    loadingUpload: false,
    loadingDelete: false,
    error: null
})

//TODO Implement a deep comparison function, refer to OCCAZ
const isEqual = (a:any, b:any) : boolean=>{
    if (a === b) return true;   

    if(Array.isArray(a) && Array.isArray(b)){
        if(a.length !== b.length) {
            return false
        };
        return a.every((item, index)=>isEqual(item, b[index]))}

    if(typeof a === "object" && typeof b === "object" && a && b){
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if(keysA.length !== keysB.length) return false;
        return keysA.every(key=>isEqual(a[key], b[key]));
    }

    return false
}

const hasChanged = (draftSection:FAQSectionData, reduxSection:FAQSectionData)=>{
    for(const key of Object.keys(reduxSection) as (keyof FAQSectionData)[]){
        const originalValue = reduxSection[key];
        const newValue = draftSection[key];

        if(newValue !== undefined && !isEqual(originalValue, newValue)){
            return true;
        }
    }
    return false;
}

export const fetchFAQ = createAsyncThunk("faq/fetchFAQ", async(_, thunkAPI)=>{
    try{
        const faqSections = await adminService.getFAQ()
        if(!faqSections){
            throw new Error("No FAQ data was retrieved")
        }
        return faqSections.sort((a,b)=>b.index - a.index )
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch FAQ Sections: ${errorMessage}`);
    }
}, {
    // Read the current store synchronously: multiple hook consumers share one request.
    condition: (_, { getState }) => !(getState() as RootState).faq.loadingFetch,
})

export const saveFAQ = createAsyncThunk("faq/saveFAQ", async(sections: FAQSectionData[], thunkAPI)=>{
    try {
        let sectionsToSave: FAQSectionData[] = [];
        let sectionsToDelete : string[] = [];
        const draftCopy = structuredClone(sections);
        const currentState = thunkAPI.getState() as RootState;
        const reduxSections = selectFAQSections(currentState);
        draftCopy.map((s, index)=>{
            s.index = index;
            const matchedSection = reduxSections.find(section=>section.id === s.id);
            if(!matchedSection){
                sectionsToSave.push(s);
            }else if(hasChanged(s, matchedSection!)){
                sectionsToSave.push(s);
            }
        });

        reduxSections.map(section=>{
            const found = draftCopy.find(s=>s.id === section.id);
            if(!found){
                sectionsToDelete.push(section.id);
            }
        });

        const saved = await adminService.uploadFAQSections(sectionsToSave, sectionsToDelete)
    
        if(saved){
            return draftCopy;
        }
    } catch (err) {
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to save FAQ sections: ${errorMessage}`);
    }
})
export const deleteFAQSection = createAsyncThunk<string, FAQSectionData>("faq/deleteFAQSection", async(faqData, thunkAPI)=>{
    try{
        const deleted = await adminService.deleteFAQSection(faqData.id);
        if(!deleted){
            return thunkAPI.rejectWithValue("FAQ Section was not deleted");
        }
        return faqData.id;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to delete FAQ section: ${errorMessage}`);
    }
})

export const createFAQSection = createAsyncThunk<FAQSectionData, FormAndUserData>("faq/createFAQSection", async(formData, thunkAPI) => {
    try{
        const newSection = await adminService.createFAQSection(formData);

        if(!newSection){
            throw new Error("New Section was undefined");
        }

        return newSection;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to create FAQ section: ${errorMessage}`)
    }
})

export const updateFAQSection = createAsyncThunk<FAQSectionData, UpdateFAQ>("faq/updateFAQSection", async({originalFAQSection, newFAQSection}, thunkAPI) => {
    try{
        const updatedService = await adminService.updateFAQSection(originalFAQSection, newFAQSection)

        if(updatedService){
            return newFAQSection;
        }else{
            throw new Error("FAQ Section was not updated");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update FAQ: ${errorMessage}`)
    }
})
// export const deleteAboutSection = createAsyncThunk<ServiceData, ServiceData>("about/deleteAboutSection", async(serviceData, thunkAPI)=>{
//     try{
//         let deleted = await adminService.deleteFAQSection(serviceData.id);
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

const faqSlice = createSlice({
    name: "faq",
    initialState, 
    reducers: {
        clearFAQ(state){
            faqAdapter.removeAll(state);
            state.fetchStatus = "idle";
        },
        clearFAQError(state){
            state.fetchError = null;
            state.error = null
        }
    },
    extraReducers(builder){
        builder
        .addCase(fetchFAQ.pending, (state)=>{
            state.fetchError = null;
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchFAQ.fulfilled, (state, action)=>{
            state.fetchError = null;
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            faqAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchFAQ.rejected, (state, action)=>{
            state.fetchError = action.payload as string;
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        .addCase(updateFAQSection.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(updateFAQSection.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            faqAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            })
            state.error = null;
        })
        .addCase(updateFAQSection.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
        .addCase(createFAQSection.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(createFAQSection.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            faqAdapter.addOne(state, action.payload)
            state.error = null;
        })
        .addCase(createFAQSection.rejected, (state, action)=>{
            state.loadingFetch = false;
            state.error = action.payload as string;
        })
        .addCase(deleteFAQSection.pending, (state)=>{
            state.loadingDelete = true;
            state.error = null;
        })
        .addCase(deleteFAQSection.fulfilled, (state, action)=>{
            state.loadingDelete = false;
            faqAdapter.removeOne(state, action.payload)
            state.error = null;
        })
        .addCase(deleteFAQSection.rejected, (state, action)=>{
            state.loadingDelete = false;
            state.error = action.payload as string;
        })
        .addCase(saveFAQ.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(saveFAQ.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            faqAdapter.setAll(state, action.payload!)
            state.error = null;
        })
        .addCase(saveFAQ.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
    }
})

export const {clearFAQError, clearFAQ} = faqSlice.actions
export default faqSlice.reducer
