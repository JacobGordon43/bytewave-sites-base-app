/**
 * Expose catalog data only for the current account while a new account's request loads.
 */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../auth/AuthContext";
import type { AppDispatch, RootState } from "./store";
import { fetchStripeCatalog } from "./stripeCatalogSlice";

export function useStripeCatalog() {
  const { sub } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((state: RootState) => state.stripeCatalog);
  useEffect(() => {
    if (sub) void dispatch(fetchStripeCatalog({ owner: sub }));
  }, [dispatch, sub]);
  return {
    products: state.owner === sub ? state.products : [],
    error: state.owner === sub ? state.error : null,
    loading: state.owner !== sub || state.status === "loading" || state.status === "idle",
    owner: sub || "",
    refresh: () => {
      if (sub) void dispatch(fetchStripeCatalog({ owner: sub, force: true }));
    },
  };
}
