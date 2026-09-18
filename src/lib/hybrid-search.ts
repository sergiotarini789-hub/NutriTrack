/**
 * Stage 8B — hybrid search composition (pure, client-side).
 *
 * Combines the three result sources:
 *   A. local products (built-in generics + user products)
 *   B. cached Open Food Facts products (off-products localStorage)
 *   C. fresh Open Food Facts search results
 *
 * Deduplication rules (per spec):
 *   - primary key: normalized barcode — the same physical product must
 *     never be shown twice;
 *   - fallback key: normalized brand + name (when a barcode is absent);
 *   - priority: local/user > cached OFF > remote OFF.
 *
 * The category filter intentionally applies to LOCAL and CACHED
 * products only — remote OFF results are not filtered by the local
 * category chips (option A of the spec: never fake a category match).
 */
import { normalizeBarcode } from "./barcode";
import type { BrandedProduct, FoodCategoryId, FoodProduct } from "./types";

/** Search-text normalization shared by ranking and dedup keys. */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[.,;:!?«»"'ʼ’()\-–—/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Identity for dedup: normalized brand + name. */
function identityKey(product: { brand?: string; name: string }): string {
  const brand = product.brand ? normalizeSearchText(product.brand) : "";
  return `${brand}|${normalizeSearchText(product.name)}`;
}

/**
 * Are two products the same physical product?
 *
 * - both have barcodes: barcodes decide (authoritative; two different
 *   barcodes are different products even with equal names);
 * - at least one lacks a barcode: fall back to normalized brand+name.
 */
function areDuplicates(
  a: { barcode?: string; brand?: string; name: string },
  b: { barcode?: string; brand?: string; name: string },
): boolean {
  const barcodeA = normalizeBarcode(a.barcode);
  const barcodeB = normalizeBarcode(b.barcode);
  if (barcodeA && barcodeB) return barcodeA === barcodeB;
  return identityKey(a) === identityKey(b);
}

/**
 * Searches the cached OFF products (source B) by name, brand and
 * barcode. Applies the local category filter when one is active —
 * cached products carry a mapped NutriTrack category.
 */
export function searchOffCache(
  cached: BrandedProduct[],
  query: string,
  category: string,
): BrandedProduct[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const barcode = normalizeBarcode(query);
  return cached.filter((product) => {
    if (category !== "all" && product.category !== (category as FoodCategoryId)) {
      return false;
    }
    if (barcode && product.barcode === barcode) return true;
    return (
      normalizeSearchText(product.name).includes(normalized) ||
      (product.brand ? normalizeSearchText(product.brand).includes(normalized) : false)
    );
  });
}

/**
 * Merges cached (B) and remote (C) OFF results, deduplicated; cached
 * products win over remote duplicates and keep their position first.
 */
export function mergeOffResults(
  cached: BrandedProduct[],
  remote: BrandedProduct[],
): BrandedProduct[] {
  const merged: BrandedProduct[] = [];
  for (const product of [...cached, ...remote]) {
    if (merged.some((accepted) => areDuplicates(accepted, product))) continue;
    merged.push(product);
  }
  return merged;
}

/**
 * Removes OFF products that duplicate any LOCAL product (source A
 * always wins). Local products without a barcode still win through the
 * brand+name fallback key.
 */
export function dedupeAgainstLocal(
  local: FoodProduct[],
  off: BrandedProduct[],
): BrandedProduct[] {
  return off.filter(
    (product) =>
      !local.some((localProduct) => areDuplicates(localProduct, product)),
  );
}
