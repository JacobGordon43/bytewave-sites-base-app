import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";

import { useEffect } from "react";
import adminService from "../services/adminService";
import { setPlatformStatus, setStatusError } from "../redux/statusSlice";

const usePlatformStatus = () => {
  const dispatch = useDispatch<AppDispatch>();
  // const [loading, setLoading] = useState(true);
  // const [status, setStatus] = useState<PlatformStatus | null>();
  // const [error, setError] = useState<string | null>();
  const { status, loading } = useSelector((state: RootState) => state.status);
  useEffect(()=>{
    const fetchStatus = async()=>{
      try{
        const results = await adminService.fetchPlatformStatus()
        dispatch(setPlatformStatus(results))
      }catch(err : any){
        dispatch(setStatusError(err.message!));
        dispatch(setPlatformStatus("operational"))
      }
    }
    fetchStatus();
  }, [dispatch])


  return { status, loading };
};

export default usePlatformStatus;