import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchPortfolio, clearPortfolioError } from "../redux/portfolioSlice";
import { selectPortfolio } from "../redux/selectors/portfolioSelector";

/** Shared read behavior; forms and mutations stay in their existing components. */
export function usePortfolio() {
  const dispatch = useDispatch<AppDispatch>();
  const slice = useSelector((state: RootState) => state.portfolio);
  const items = useSelector(selectPortfolio);
  const status = slice.fetchStatus;
  const error = slice.fetchError ?? null;

  useEffect(() => {
    if (status === "idle") void dispatch(fetchPortfolio());
  }, [dispatch, status]);

  const retry = useCallback(() => { void dispatch(fetchPortfolio()); }, [dispatch]);
  const dismissError = useCallback(() => { dispatch(clearPortfolioError()); }, [dispatch]);

  return { items, slice, status, error, isLoading: status === "idle" || slice.loadingFetch, retry, dismissError };
}
