// Catalog API amounts are dollars; intervalCount carries cadences such as six months.
export interface CatalogPrice {
  id: string;
  amount: number | null;
  currency: string;
  active: boolean;
  interval: string | null;
  intervalCount: number;
  billable: boolean;
  subscribable: boolean;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  published: boolean;
  hosting: boolean;
  prices: CatalogPrice[];
}

// Creation form choices; the backend translates six_months into Stripe interval/count fields.
export interface NewCatalogProduct {
  hosting?: boolean;
  requestId: string;
  name: string;
  description: string;
  amount: number;
  interval: "one_time" | "month" | "six_months" | "year";
  published: boolean;
}
