/**
 * Translate Stripe products/prices into the catalog and validate admin bill items.
 * The browser's catalog is a convenience cache; Stripe is checked again when saving a bill.
 */
import type Stripe from "stripe";
import { ApiError } from "./tenant-query";
import { stripeClient } from "./stripe-payment";
import type { CatalogProduct, NewCatalogProduct } from "../../../src/types/catalogTypes";

// One deployment serves one Stripe account. Connect will need a server-side account map.
export function assertCatalogTenant(businessId: string) {
  if (!process.env.VITE_APP_BUSINESS_ID)
    throw new ApiError(
      503,
      "Set VITE_APP_BUSINESS_ID in the backend deployment environment before using the Stripe catalog.",
    );
  if (businessId !== process.env.VITE_APP_BUSINESS_ID)
    throw new ApiError(404, "Catalog not found.");
}

// One-time checkout supports fixed, exclusive-tax USD prices without quantity transforms.
export function isBillablePrice(price: Stripe.Price) {
  return (
    price.active &&
    price.type === "one_time" &&
    price.currency === "usd" &&
    price.billing_scheme === "per_unit" &&
    !price.transform_quantity &&
    !price.custom_unit_amount &&
    price.unit_amount !== null &&
    price.tax_behavior !== "inclusive"
  );
}

// Recurring checkout additionally requires licensed monthly/yearly prices (including interval counts).
export function isSubscriptionPrice(price: Stripe.Price) {
  return (
    price.active &&
    price.type === "recurring" &&
    price.currency === "usd" &&
    price.billing_scheme === "per_unit" &&
    !price.transform_quantity &&
    !price.custom_unit_amount &&
    price.unit_amount !== null &&
    price.tax_behavior !== "inclusive" &&
    price.recurring?.usage_type === "licensed" &&
    ["month", "year"].includes(price.recurring.interval) &&
    price.recurring.interval_count >= 1
  );
}

// The public catalog exposes only explicitly published products and allowed prices.
// Admin responses include archived/unsupported prices so their availability is visible.
export function catalogProduct(
  product: Stripe.Product,
  prices: Stripe.Price[],
  publicOnly = false,
): CatalogProduct | null {
  const published = product.metadata.storefrontVisible === "true";
  if (publicOnly && (!product.active || !published)) return null;
  const defaultPrice =
    typeof product.default_price === "string" ? product.default_price : product.default_price?.id;
  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    active: product.active,
    published,
    hosting: product.metadata.serviceType === "hosting",
    prices: prices
      .filter(
        (price) =>
          !publicOnly ||
          (price.active &&
            (price.id === defaultPrice || price.metadata.storefrontVisible === "true")),
      )
      .map((price) => ({
        id: price.id,
        amount: price.unit_amount === null ? null : price.unit_amount / 100,
        currency: price.currency,
        active: price.active,
        interval: price.recurring?.interval || null,
        intervalCount: price.recurring?.interval_count || 1,
        billable: product.active && isBillablePrice(price),
        subscribable: product.active && isSubscriptionPrice(price),
      })),
  };
}

// Create a product and its first price in one Stripe request. The UI's six_months
// selection becomes a monthly Stripe interval with interval_count=6.
export function validateProductInput(input: NewCatalogProduct): Stripe.ProductCreateParams {
  if (
    !input ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.length > 250 ||
    typeof input.description !== "string" ||
    input.description.length > 2000 ||
    typeof input.published !== "boolean" ||
    !["one_time", "month", "six_months", "year"].includes(input.interval) ||
    typeof input.requestId !== "string" ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId)
  ) {
    throw new ApiError(
      400,
      "Provide a service name, description, billing interval and request ID.",
    );
  }
  const cents = moneyCents(input.amount);
  return {
    name: input.name.trim(),
    description: input.description.trim() || undefined,
    metadata: {
      storefrontVisible: String(input.published),
      serviceType: input.hosting === true ? "hosting" : "general",
    },
    default_price_data: {
      currency: "usd",
      unit_amount: cents,
      tax_behavior: "exclusive",
      ...(input.interval === "one_time"
        ? {}
        : {
            recurring:
              input.interval === "six_months"
                ? { interval: "month", interval_count: 6 }
                : { interval: input.interval },
          }),
    },
    expand: ["default_price"],
  };
}

// Convert dollars to integer cents and reject fractional cents before any charge or database write.
export function moneyCents(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 999999.99)
    throw new ApiError(400, "Enter a valid price between $0 and $999,999.99.");
  const cents = Math.round(value * 100);
  if (Math.abs(value * 100 - cents) > 0.00001)
    throw new ApiError(400, "Prices must have at most two decimal places.");
  return cents;
}

export type BillItem = {
  id: string;
  item: string;
  unitPrice: number;
  quantity: number;
  pricingMode: "custom" | "catalog" | "override";
  stripeProductId?: string;
  stripePriceId?: string;
  stripeTaxCode?: string;
  hosting?: boolean;
  recurring?: { interval: "month" | "year"; intervalCount: number };
};

/**
 * Build the trusted bill snapshot: custom items keep the admin's description/price;
 * catalog items must match Stripe's price; overrides keep the negotiated amount.
 * Product name, tax code, cadence and hosting flag always come from Stripe.
 */
export async function normalizeBillItems(
  value: unknown,
  businessId: string,
  getStripe = stripeClient,
  subscription = false,
): Promise<BillItem[]> {
  if (!Array.isArray(value) || !value.length || value.length > 100)
    throw new ApiError(400, "Add between 1 and 100 bill items.");
  const result: BillItem[] = [];
  if (subscription && (value.length !== 1 || value[0]?.quantity !== 1))
    throw new ApiError(
      400,
      "A subscription requires exactly one recurring service with quantity 1. Create separate bills for other items.",
    );
  // Avoid repeated Stripe requests when several bill lines use the same price.
  const prices = new Map<string, Stripe.Price>();
  for (const input of value) {
    if (
      !input ||
      typeof input.id !== "string" ||
      !input.id.trim() ||
      input.id.length > 100 ||
      !Number.isSafeInteger(input.quantity) ||
      input.quantity < 1 ||
      input.quantity > 999999
    )
      throw new ApiError(400, "Each item needs an ID and a positive whole-number quantity.");
    const mode = input.pricingMode || "custom";
    const cents = moneyCents(input.unitPrice);
    // Older bills without a pricingMode are treated as custom one-time items.
    // Explicit construction below drops any submitted Stripe IDs or hosting flags.
    if (mode === "custom") {
      if (subscription)
        throw new ApiError(
          400,
          "Select a recurring catalog service. You can override its price for this subscription.",
        );
      if (typeof input.item !== "string" || !input.item.trim() || input.item.length > 250)
        throw new ApiError(400, "Enter a name for each custom item.");
      result.push({
        id: input.id,
        item: input.item.trim(),
        quantity: input.quantity,
        unitPrice: cents / 100,
        pricingMode: "custom",
      });
      continue;
    }
    if (mode !== "catalog" && mode !== "override") throw new ApiError(400, "Invalid pricing mode.");
    assertCatalogTenant(businessId);
    if (
      typeof input.stripePriceId !== "string" ||
      !/^price_[a-zA-Z0-9]+$/.test(input.stripePriceId)
    )
      throw new ApiError(400, "Select a catalog price.");
    let price = prices.get(input.stripePriceId);
    if (!price) {
      price = await getStripe().prices.retrieve(input.stripePriceId, { expand: ["product"] });
      prices.set(price.id, price);
    }
    const product = price.product;
    if (
      typeof product === "string" ||
      product.deleted ||
      !product.active ||
      !(subscription ? isSubscriptionPrice(price) : isBillablePrice(price))
    )
      throw new ApiError(
        400,
        "Select an active fixed USD price matching this bill's billing mode, without inclusive tax.",
      );
    if (input.stripeProductId !== product.id)
      throw new ApiError(400, "The selected product and price do not match.");
    if (mode === "catalog" && cents !== price.unit_amount)
      throw new ApiError(
        409,
        "The catalog price changed. Refresh the catalog and add the item again.",
      );
    // Snapshot the tax code and recurring metadata now. Product metadata changes
    // later do not retroactively turn an existing bill into a hosting subscription.
    const taxCode = typeof product.tax_code === "string" ? product.tax_code : product.tax_code?.id;
    result.push({
      id: input.id,
      item: product.name,
      quantity: input.quantity,
      unitPrice: cents / 100,
      pricingMode: mode,
      stripeProductId: product.id,
      stripePriceId: price.id,
      ...(taxCode ? { stripeTaxCode: taxCode } : {}),
      ...(subscription
        ? {
            recurring: {
              interval: price.recurring!.interval as "month" | "year",
              intervalCount: price.recurring!.interval_count,
            },
            hosting: product.metadata.serviceType === "hosting",
          }
        : {}),
    });
  }
  billTotalCents(result);
  return result;
}

// Recalculate totals on the server; never trust a total supplied by the browser.
export function billTotalCents(items: BillItem[]) {
  const total = items.reduce((sum, item) => sum + moneyCents(item.unitPrice) * item.quantity, 0);
  if (!Number.isSafeInteger(total) || total > 99999999)
    throw new ApiError(400, "Bill total exceeds $999,999.99.");
  return total;
}
