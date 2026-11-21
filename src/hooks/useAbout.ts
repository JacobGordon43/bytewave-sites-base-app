import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchAbout, clearAboutError } from "../redux/aboutSlice";
import { selectAboutSections } from "../redux/selectors/aboutSelector";

/** Shared read behavior; forms and mutations stay in their existing components. */
export function useAbout() {
  const dispatch = useDispatch<AppDispatch>();
  const slice = useSelector((state: RootState) => state.about);
  const items = useSelector(selectAboutSections);
  const status = slice.fetchStatus;
  const error = slice.fetchError ?? null;

  useEffect(() => {
    if (status === "idle") void dispatch(fetchAbout());
  }, [dispatch, status]);

  const retry = useCallback(() => { void dispatch(fetchAbout()); }, [dispatch]);
  const dismissError = useCallback(() => { dispatch(clearAboutError()); }, [dispatch]);

  return { items, slice, status, error, isLoading: status === "idle" || slice.loadingFetch, retry, dismissError };
}
