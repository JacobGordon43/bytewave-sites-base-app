/**
 * Short-lived admin catalog cache, scoped to the signed-in account.
 * Prices are checked again by the backend when a bill is saved; this is not payment authority.
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { CatalogProduct } from "../types/catalogTypes";
import { catalogError, loadCatalog } from "../services/catalogService";

interface CatalogState {
  products: CatalogProduct[];
  owner: string;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  fetchedAt: number;
  requestId?: string;
}
const initialState: CatalogState = {
  products: [],
  owner: "",
  status: "idle",
  error: null,
  fetchedAt: 0,
};

export const fetchStripeCatalog = createAsyncThunk<
  CatalogProduct[],
  { owner: string; force?: boolean },
  { state: { stripeCatalog: CatalogState }; rejectValue: string }
>(
  "stripeCatalog/fetchStripeCatalog",
  async (_, { signal, rejectWithValue }) => {
    try {
      return await loadCatalog(signal);
    } catch (error) {
      return rejectWithValue(catalogError(error));
    }
  },
  {
    condition: ({ owner, force }, { getState }) => {
      const state = getState().stripeCatalog;
      if (state.owner !== owner) return true;
      if (state.status === "loading") return false;
      // Reuse a successful load for five minutes; Refresh bypasses this time check.
      return force || state.status !== "succeeded" || Date.now() - state.fetchedAt > 300000;
    },
  },
);

const slice = createSlice({
  name: "stripeCatalog",
  initialState,
  reducers: {
    clearStripeCatalog: () => initialState,
    catalogProductAdded: (
      state,
      action: PayloadAction<{ owner: string; product: CatalogProduct }>,
    ) => {
      if (state.owner !== action.payload.owner) return;
      state.products = [
        action.payload.product,
        ...state.products.filter((product) => product.id !== action.payload.product.id),
      ];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStripeCatalog.pending, (state, action) => {
        if (state.owner !== action.meta.arg.owner) state.products = [];
        state.owner = action.meta.arg.owner;
        state.requestId = action.meta.requestId;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchStripeCatalog.fulfilled, (state, action) => {
        // Ignore a late response if a newer request or account switch has superseded it.
        if (state.requestId !== action.meta.requestId) return;
        state.products = action.payload;
        state.status = "succeeded";
        state.fetchedAt = Date.now();
      })
      .addCase(fetchStripeCatalog.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = "failed";
        state.error = action.payload || "Unable to load the catalog.";
      });
  },
});
export const { clearStripeCatalog, catalogProductAdded } = slice.actions;
export default slice.reducer;
