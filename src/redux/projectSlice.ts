import { createAsyncThunk, createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FetchStatus } from "./fetchStatus";
import adminService from "../services/adminService";
import type { PageOrFeature, ProjectData } from "../types/daoTypes";

interface UpdateProject{
    originalProject : ProjectData,
    newProject : ProjectData
}
interface createProjectData {
    formData: FormData,
    pages : PageOrFeature[],
    features : PageOrFeature[]
}
export const fetchProjects = createAsyncThunk("projects/fetchProjects", async (_, thunkAPI) => {
    try{
        const projects = await adminService.getProjects();
        return projects;
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch projects: ${errorMessage}`);
    }
})

export const fetchAllProjectsByClient = createAsyncThunk("projects/fetchAllProjectsByClient", async(clientId:string, thunkAPI)=>{
    try{
        if(!clientId){
            return thunkAPI.rejectWithValue("No clientId provided");
        }
        const projects = await adminService.getProjectsByClientId(clientId);
        if(!projects){
            return thunkAPI.rejectWithValue("No project data was retrieved");
        }
        //let sortedTickets = tickets.sort((a,b)=> Number(b.dateCreated) - Number(a.dateCreated));
        return {clientId, tickets: projects}
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to fetch projects: ${errorMessage}`);
    }
})

export const updateProject = createAsyncThunk<ProjectData, UpdateProject>("projects/updateProject", async({originalProject, newProject}, thunkAPI)=>{
    try{
        const updatedProject = await adminService.updateProject(originalProject, newProject);

        if(updatedProject){
            return newProject;
        }else{
            throw new Error("Project was not updated");
        }
    }catch(err){
        let errorMessage;
        if(err instanceof Error){
            errorMessage = err.message;
        }else{
            errorMessage = "Unknown error occurred";
        }
        return thunkAPI.rejectWithValue(`Failed to update project: ${errorMessage}`);
    }
})
export const createProject = createAsyncThunk<ProjectData, createProjectData>("projects/createProject", async(project, thunkAPI) =>{
    try {
        const newProject = await adminService.createProject(project.formData, project.pages, project.features)
        if(!newProject){
            return thunkAPI.rejectWithValue("Project not created.")
        }
        return newProject
    } catch {
        return thunkAPI.rejectWithValue("Failed to create project. Error occurred.")
    }
})

export const projectsAdapter = createEntityAdapter({
    selectId: (project:ProjectData) => project.id,
    sortComparer:(a, b) => b.dateCreated - a.dateCreated
})
interface ProjectState extends ReturnType<typeof projectsAdapter.getInitialState>{
    clientHistoryFetched: Record<string, boolean>,
    projects: ProjectData[],
    loadingFetch: boolean,
    fetchStatus: FetchStatus,
    loadingCreate: boolean,
    error: string | null
}

const initialState: ProjectState = projectsAdapter.getInitialState({
    clientHistoryFetched: {},
    projects: [],
    loadingFetch: false,
    fetchStatus: "idle",
    loadingCreate: false,
    error: null
});


const projectSlice = createSlice({
    name: "projects",
    initialState,
    reducers: {
        clearProjects(state){
            state.projects = [];
            state.fetchStatus = "idle";
        },
        clearProjectError(state){
            state.error = null;
        },
        resetProjectSlice: () => initialState,
        updateProjectLocally(state, action: PayloadAction<ProjectData>){
            projectsAdapter.updateOne(state, {
                id:action.payload.id,
                changes: action.payload
            })
        }
    },
extraReducers: (builder) => {
    builder
    //Getting all projects
        .addCase(fetchProjects.pending, (state) => {
            state.loadingFetch = true;
            state.fetchStatus = "loading";
            state.error = null;
        })
        .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<ProjectData[]>) => {
            state.loadingFetch = false;
            state.fetchStatus = "succeeded";
            state.projects = action.payload;
        })
        .addCase(fetchProjects.rejected, (state, action) => {
            state.loadingFetch = false;
            state.fetchStatus = "failed";
            state.error = action.payload as string;
        })
        //Get projects by ID
        .addCase(fetchAllProjectsByClient.pending, (state) => {
            state.loadingFetch = true;
            state.error = null;
        })
        .addCase(fetchAllProjectsByClient.fulfilled, (state, action: PayloadAction<{clientId: string, tickets: ProjectData[]}>) => {
            const {clientId, tickets} = action.payload
            state.loadingFetch = false;
            projectsAdapter.upsertMany(state, tickets)
            state.clientHistoryFetched[clientId] = true
            state.error = null;
        })
        .addCase(fetchAllProjectsByClient.rejected, (state, action) => {
            state.loadingFetch = false;
            state.error = action.payload as string;
        })
        //Creating a project
        .addCase(createProject.pending, (state) => {
            state.loadingCreate = true;
            state.error = null;
        })
        .addCase(createProject.fulfilled, (state, action: PayloadAction<ProjectData>) => {
            state.loadingCreate = false;
            projectsAdapter.addOne(state, action.payload);
        })
        .addCase(createProject.rejected, (state, action) => {
            state.loadingCreate = false;
            state.error = action.payload as string;
        })
        //Update projects
        .addCase(updateProject.pending, (state) => {
            state.loadingCreate = true;
            state.error = null;
        })
        .addCase(updateProject.fulfilled, (state, action: PayloadAction<ProjectData>) => {
            state.loadingCreate = false;
            projectsAdapter.setOne(state, action.payload)
            // projectsAdapter.updateOne(state, {
            //     id: action.payload.id,
            //     changes: action.payload
            // })
            state.error = null;
        })
        .addCase(updateProject.rejected, (state, action) => {
            state.loadingCreate = false;
            state.error = action.payload as string;
        }) 
    }
})

export const {clearProjects, clearProjectError, resetProjectSlice, updateProjectLocally} = projectSlice.actions;
export default projectSlice.reducer;
