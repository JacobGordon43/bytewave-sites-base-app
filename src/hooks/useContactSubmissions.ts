import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchContactSubmissions, clearContactError } from "../redux/contactSlice";
import { selectAllSubmissions } from "../redux/selectors/contactSelector";

/** Shared reads only; editing and submission behavior stays in the component. */
export function useContactSubmissions() {
  const dispatch = useDispatch<AppDispatch>();
  const slice = useSelector((state: RootState) => state.contact);
  const items = useSelector(selectAllSubmissions);
  const status = slice.fetchStatus;
  const error = slice.fetchError ?? null;
  useEffect(() => {
    if (status === "idle") void dispatch(fetchContactSubmissions());
  }, [dispatch, status]);
  const retry = useCallback(() => { void dispatch(fetchContactSubmissions()); }, [dispatch]);
  const dismissError = useCallback(() => { dispatch(clearContactError()); }, [dispatch]);
  return { items, slice, status, error, isLoading: status === "idle" || slice.loadingFetch, retry, dismissError };
}
