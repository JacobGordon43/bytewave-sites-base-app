
import adminService from "../services/adminService";
import type { Status } from "../types/daoTypes";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { setPlatformStatus, setStatusError } from "../redux/statusSlice";

const usePlatformStatusUpdate = () =>{
    const statusSlice = useSelector((state:RootState) => state.status)
    const {error, loading} = statusSlice
    const dispatch = useDispatch<AppDispatch>();
    
    const updateStatus = async(status: Status)=>{
        try{
            const updated = await adminService.updatePlatformStatus(status)
            
            if(updated){
                dispatch(setPlatformStatus(status));
                return true
            }else{
                dispatch(setStatusError("The status was not updated."))
                return false;
            }
        }catch(err){
            
            dispatch(setPlatformStatus("operational"))
            if(err instanceof Error){
                dispatch(setStatusError(err.message))
            }else{
                dispatch(setStatusError("There was an issue updating the platform status"))
            }
            return false;
        }
    }

    return {
        updateStatus,
        error,
        loading
    }
}

export default usePlatformStatusUpdate;