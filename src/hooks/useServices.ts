import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchServices, clearServiceError } from "../redux/servicesSlice";
import { selectServices } from "../redux/selectors/servicesSelector";

/** Shared read behavior; forms and mutations stay in their existing components. */
export function useServices() {
  const dispatch = useDispatch<AppDispatch>();
  const slice = useSelector((state: RootState) => state.services);
  const items = useSelector(selectServices);
  const status = slice.fetchStatus;
  const error = slice.fetchError ?? null;

  useEffect(() => {
    if (status === "idle") void dispatch(fetchServices());
  }, [dispatch, status]);

  const retry = useCallback(() => { void dispatch(fetchServices()); }, [dispatch]);
  const dismissError = useCallback(() => { dispatch(clearServiceError()); }, [dispatch]);

  return { items, slice, status, error, isLoading: status === "idle" || slice.loadingFetch, retry, dismissError };
}
