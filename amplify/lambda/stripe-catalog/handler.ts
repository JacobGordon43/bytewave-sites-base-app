import { withCreateValidation } from "../shared/validate-create";
/**
 * One Lambda serves public catalog reads and authenticated admin catalog reads/creation.
 * Public visibility is opt-in; only admins can create products or see private pricing.
 */
import type Stripe from "stripe";
import type { AuthenticatedApiEvent } from "../shared/types";
import { ApiError, getTenantIdentity, response } from "../shared/tenant-query";
import { stripeClient } from "../shared/stripe-payment";
import {
  assertCatalogTenant,
  catalogProduct,
  validateProductInput,
} from "../shared/stripe-catalog";

export const createCatalogHandler =
  (getStripe = stripeClient) =>
  async (event: AuthenticatedApiEvent) => {
    try {
      const publicOnly = event.routeKey === "GET /public/catalog/{businessId}";
      let businessId: string;
      if (publicOnly) businessId = event.pathParameters?.businessId || "";
      else {
        const identity = getTenantIdentity(event);
        if (!identity.roles.includes("Bytewave-Admin"))
          throw new ApiError(403, "Administrator access required.");
        businessId = identity.businessId;
      }
      assertCatalogTenant(businessId);
      const stripe = getStripe();
      if (event.requestContext.http.method === "POST" && !publicOnly) {
        const input = JSON.parse(event.body || "{}");
        const params = validateProductInput(input);
        // A retry of the same admin submission must not create a second product/price.
        const product = await stripe.products.create(params, {
          idempotencyKey: `catalog:${businessId}:${input.requestId}`,
        });
        return response(
          201,
          {
            success: true,
            result: catalogProduct(product, [product.default_price as Stripe.Price]),
          },
          "OPTIONS,GET,POST",
        );
      }
      // Page products separately from prices. Each product's prices are fetched across all pages.
      const cursor = event.queryStringParameters?.nextToken;
      if (cursor && !/^prod_[a-zA-Z0-9]+$/.test(cursor))
        throw new ApiError(400, "Invalid catalog cursor.");
      const products = await stripe.products.list({
        limit: 10,
        ...(cursor ? { starting_after: cursor } : {}),
        ...(publicOnly ? { active: true } : {}),
      });
      const results = await Promise.all(
        products.data.map(async (product) => {
          if (publicOnly && product.metadata.storefrontVisible !== "true") return null;
          const prices: Stripe.Price[] = [];
          for await (const price of stripe.prices.list({
            product: product.id,
            limit: 100,
            ...(publicOnly ? { active: true } : {}),
          }))
            prices.push(price);
          return catalogProduct(product, prices, publicOnly);
        }),
      );
      return response(200, {
        success: true,
        results: results.filter(Boolean),
        nextToken: products.has_more ? products.data.at(-1)?.id : undefined,
      });
    } catch (error) {
      if (error instanceof ApiError)
        return response(error.statusCode, { success: false, message: error.message });
      if (error instanceof SyntaxError)
        return response(400, { success: false, message: "Invalid JSON body." });
      console.error("Stripe catalog request failed", error);
      return response(502, {
        success: false,
        message: "Unable to access the Stripe catalog. Check its configuration and try again.",
      });
    }
  };

const validatedHandler = createCatalogHandler();

export const handler = withCreateValidation("/app/admin/catalog", validatedHandler, "POST");
