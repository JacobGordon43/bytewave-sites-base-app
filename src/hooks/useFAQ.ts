import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchFAQ, clearFAQError } from "../redux/faqSlice";
import { selectFAQSections } from "../redux/selectors/faqSelector";

/** Shared read behavior; forms and mutations stay in their existing components. */
export function useFAQ() {
  const dispatch = useDispatch<AppDispatch>();
  const slice = useSelector((state: RootState) => state.faq);
  const items = useSelector(selectFAQSections);
  const status = slice.fetchStatus;
  const error = slice.fetchError ?? null;

  useEffect(() => {
    if (status === "idle") void dispatch(fetchFAQ());
  }, [dispatch, status]);

  const retry = useCallback(() => { void dispatch(fetchFAQ()); }, [dispatch]);
  const dismissError = useCallback(() => { dispatch(clearFAQError()); }, [dispatch]);

  return { items, slice, status, error, isLoading: status === "idle" || slice.loadingFetch, retry, dismissError };
}
