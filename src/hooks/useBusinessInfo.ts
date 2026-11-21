import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchBusinessInfo, clearBusinessError } from "../redux/businessSlice";

/** Shared reads only; editing and submission behavior stays in the component. */
export function useBusinessInfo() {
  const dispatch = useDispatch<AppDispatch>();
  const slice = useSelector((state: RootState) => state.businessInfo);
  const items = slice.info;
  const status = slice.fetchStatus;
  const error = slice.fetchError ?? null;
  useEffect(() => {
    if (status === "idle") void dispatch(fetchBusinessInfo());
  }, [dispatch, status]);
  const retry = useCallback(() => { void dispatch(fetchBusinessInfo()); }, [dispatch]);
  const dismissError = useCallback(() => { dispatch(clearBusinessError()); }, [dispatch]);
  return { items, slice, status, error, isLoading: status === "idle" || slice.loadingFetch, retry, dismissError };
}
