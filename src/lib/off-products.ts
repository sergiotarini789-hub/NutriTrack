import { normalizeBarcode } from "./barcode";
import { loadOffProducts, saveOffProducts } from "./storage";
import type { BrandedProduct } from "./types";

/**
 * Local cache of Open Food Facts products that were fetched earlier.
 *
 * Purpose: diary entries reference external products by id
 * ("off-<barcode>"), so the normalized product definition must remain
 * available offline and across reloads without re-fetching. Only the
 * normalized NutriTrack product is stored — never the raw OFF
 * response.
 *
 * Deterministic resolution rule (Stage 7): a UserProduct with the same
 * barcode ALWAYS wins over a cached OFF product. Resolution order is
 * local repository (built-ins + user products) → this store → external
 * lookup, so stale external data can never override anything the user
 * created explicitly.
 */

/** Upper bound so the store cannot grow without limit. */
export const OFF_PRODUCTS_LIMIT = 100;

export function findOffProductById(id: string): BrandedProduct | undefined {
  return loadOffProducts().find((product) => product.id === id);
}

export function findOffProductByBarcode(
  barcode: string,
): BrandedProduct | undefined {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) return undefined;
  return loadOffProducts().find((product) => product.barcode === normalized);
}

/**
 * Adds or refreshes a fetched OFF product. Idempotent by id: an
 * existing record with the same id is replaced (refreshing its data
 * and updatedAt), never duplicated.
 */
export function upsertOffProduct(product: BrandedProduct): BrandedProduct[] {
  const collection = loadOffProducts().filter(
    (existing) => existing.id !== product.id,
  );
  const next = [product, ...collection].slice(0, OFF_PRODUCTS_LIMIT);
  saveOffProducts(next);
  return next;
}
