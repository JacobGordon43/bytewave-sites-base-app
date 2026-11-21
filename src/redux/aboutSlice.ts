import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import type { AboutSectionData, FormAndUserData } from "../types/daoTypes";
import { aboutAdapter } from "./adapters/aboutAdapter";
import adminService from "../services/adminService";
import { collectFilesFromAbout, uploadFilestoS3 } from "../utils/presignedHelper";
import type { RootState } from "./store";
import { selectAboutSections } from "./selectors/aboutSelector";

interface UpdateAbout{
    originalSection: AboutSectionData
    newSection: AboutSectionData
}

interface AboutState extends ReturnType<typeof aboutAdapter.getInitialState>{
    loadingFetch: boolean;
    fetchStatus: FetchStatus;
    fetchError: string | null;
    loadingUpload: boolean;
    loadingDelete: boolean;
    error: string | null;
}

const initialState: AboutState = aboutAdapter.getInitialState({
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
        return a.every((item, index)=>isEqual(item, b[index]))
    }

    if(typeof a === "object" && typeof b === "object" && a && b){
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if(keysA.length !== keysB.length) return false;
        return keysA.every(key=>isEqual(a[key], b[key]));
    }

    return false
}

const hasChanged = (draftSection:AboutSectionData, reduxSection:AboutSectionData)=>{
    for(const key of Object.keys(reduxSection) as (keyof AboutSectionData)[]){
        const originalValue = reduxSection[key];
        const newValue = draftSection[key];

        if(newValue !== undefined && !isEqual(originalValue, newValue)){
            return true;
        }
    }
    return false;
}

export const saveAbout = createAsyncThunk("about/saveAbout", async(sections: AboutSectionData[], thunkAPI)=>{
    try{
        let sectionsToSave : AboutSectionData[] = [];
        let sectionsToDelete : string[] = [];
        let presigned: {id: string, uploadUrl: string, key:string, fileUrl: string}[] = [];
        const draftCopy = structuredClone(sections);
        const currentState = thunkAPI.getState() as RootState
        const reduxSections = selectAboutSections(currentState)

        const files = collectFilesFromAbout(sections);
        if(files.length > 0){
            presigned = await adminService.uploadImages(files.map(f=>({id:f.id, type:f.file.type, size:f.file.size})))
            await uploadFilestoS3(presigned, files)
            // imagePresignResults = presigned?.results
        }

        draftCopy.map((s, index) => {
            s.index = index;
            s.blocks.map(b=>{
                if(b.imageFile){
                    b.imageUrl = presigned.find(f=>f.id === b.id)?.fileUrl
                }
                b.imageFile = undefined
            })
            const matchedSection = reduxSections.find(section => section.id === s.id)
            //Detects new sections & adds it to the sectionsToSave array array
            if(!matchedSection){
                sectionsToSave.push(s);
            }else if(hasChanged(s, matchedSection!)){
                sectionsToSave.push(s);
            }
        });
        //If it doesn't find a section, the section was deleted in the draft & needs to be deleted in the DB
        reduxSections.map(section => {
            const found = draftCopy.find(s=>s.id ===section.id)
            if(!found){
                sectionsToDelete.push(section.id);
            }
        });

        const saved = await adminService.uploadAboutSections(sectionsToSave, sectionsToDelete);
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
        return thunkAPI.rejectWithValue(`Failed to save about content: ${errorMessage}`);
    }
}) 

export const fetchAbout = createAsyncThunk("about/fetchAbout", async(_, thunkAPI)=>{
    try{
        const about = await adminService.getAbout()
        if(!about){
            throw new Error("No about data was retrieved")
        }
        return about.sort((a,b)=>a.index - b.index )
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch about content: ${errorMessage}`);
    }
}, {
    // Read the current store synchronously: multiple hook consumers share one request.
    condition: (_, { getState }) => !(getState() as RootState).about.loadingFetch,
})

export const createAboutSection = createAsyncThunk<AboutSectionData, FormAndUserData>("about/createAboutSection", async(formData, thunkAPI) => {
    try{
        const newSection = await adminService.createAboutSection(formData);

        if(!newSection){
            throw new Error("New Section was undefined");
        }

        return newSection
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to create about section: ${errorMessage}`)
    }
})

export const updateAboutSection = createAsyncThunk<AboutSectionData, UpdateAbout>("about/updateAboutSection", async({originalSection, newSection}, thunkAPI) => {
    try{
        const updatedSection = await adminService.updateAboutSection(originalSection, newSection)

        if(updatedSection){
            return newSection;
        }else{
            throw new Error("About Section was not updated");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update about section: ${errorMessage}`)
    }
})

export const deleteAboutSection = createAsyncThunk<string, AboutSectionData>("about/deleteAboutSection", async(aboutSectionData, thunkAPI)=>{
    try{
        const deleted = await adminService.deleteAboutSection(aboutSectionData.id);
        if(!deleted){
            return thunkAPI.rejectWithValue("About Section was not deleted.");
        }
        return aboutSectionData.id;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to delete about section: ${errorMessage}`)
    }
})

const aboutSlice = createSlice({
    name: "about",
    initialState, 
    reducers: {
        clearAboutSections(state){
            aboutAdapter.removeAll(state);
            state.fetchStatus = "idle";
        },
        clearAboutError(state){
            state.fetchError = null;
            state.error = null
        }
    },
    extraReducers(builder){
        builder
        .addCase(fetchAbout.pending, (state)=>{
            state.fetchError = null;
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchAbout.fulfilled, (state, action)=>{
            state.fetchError = null;
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            aboutAdapter.upsertMany(state, action.payload)
            state.error = null;
        })
        .addCase(fetchAbout.rejected, (state, action)=>{
            state.fetchError = action.payload as string;
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        .addCase(createAboutSection.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(createAboutSection.fulfilled, (state, action) =>{
            state.loadingUpload = false;
            aboutAdapter.upsertOne(state, action.payload)
        })
        .addCase(createAboutSection.rejected, (state, action) => {
            state.loadingUpload = false;
            state.error = action.payload as string
        })
        .addCase(updateAboutSection.pending, (state)=>{
            state.loadingFetch = true;
            state.error = null;
        })
        .addCase(updateAboutSection.fulfilled, (state, action)=>{
            state.loadingFetch = false;
            aboutAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            })
            state.error = null;
        })
        .addCase(updateAboutSection.rejected, (state, action)=>{
            state.loadingFetch = false;
            state.error = action.payload as string;
        })
        .addCase(deleteAboutSection.pending, (state)=>{
            state.loadingDelete = true;
            state.error = null;
        })
        .addCase(deleteAboutSection.fulfilled, (state, action)=>{
            state.loadingDelete = false;
            aboutAdapter.removeOne(state, action.payload)
            state.error = null;
        })
        .addCase(deleteAboutSection.rejected, (state, action)=>{
            state.loadingDelete = false;
            state.error = action.payload as string;
        })
        .addCase(saveAbout.pending, (state)=>{
            state.loadingUpload = true;
            state.error = null;
        })
        .addCase(saveAbout.fulfilled, (state, action)=>{
            state.loadingUpload = false;
            aboutAdapter.setAll(state, action.payload!)
            state.error = null;
        })
        .addCase(saveAbout.rejected, (state, action)=>{
            state.loadingUpload = false;
            state.error = action.payload as string;
        })
    }
})

export const {clearAboutSections, clearAboutError} = aboutSlice.actions
export default aboutSlice.reducer
