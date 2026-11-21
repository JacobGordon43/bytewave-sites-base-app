import axios from "axios";
import api from "./backend/axios";
import type { CatalogProduct, NewCatalogProduct } from "../types/catalogTypes";

export function catalogError(error: unknown): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string")
    return error.response.data.message;
  return error instanceof Error ? error.message : "Unable to load the catalog.";
}

// Collect all product pages before publishing a complete catalog to Redux.
export async function loadCatalog(signal?: AbortSignal): Promise<CatalogProduct[]> {
  const products: CatalogProduct[] = [];
  let nextToken: string | undefined;
  do {
    const { data } = await api.get<{
      success: boolean;
      message?: string;
      results: CatalogProduct[];
      nextToken?: string;
    }>("/app/admin/catalog", { params: { nextToken }, signal });
    if (!data.success) throw new Error(data.message || "Unable to load the catalog.");
    products.push(...data.results);
    nextToken = data.nextToken;
  } while (nextToken);
  return products;
}

export async function createCatalogProduct(input: NewCatalogProduct): Promise<CatalogProduct> {
  const { data } = await api.post("/app/admin/catalog", input);
  if (!data.success || !data.result) throw new Error(data.message || "Unable to create service.");
  return data.result;
}
