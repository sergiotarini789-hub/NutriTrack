/**
 * Server-side Open Food Facts client (Stage 7).
 *
 * Talks to the CURRENT Open Food Facts API v3 product endpoint:
 *
 *   GET {base}/api/v3/product/{barcode}.json?fields=...&lc=ru&cc=ru
 *
 * (v2 is deprecated and must not be used; v3 was verified live before
 * implementation: found → {"status":"success","result":{"id":"product_found"},
 * "product":{...}}, missing → {"status":"failure","result":{"id":"product_not_found"}}.)
 *
 * Server-only module: imported exclusively by the API route so the
 * external URL, User-Agent and response shapes never reach the browser.
 *
 * Data-quality rules follow the Stage 7A probe findings: barcode
 * identity is the primary signal; countries/quantity/serving/manufacturer
 * are NOT blindly trusted; nutrition uses per-100 g/ml values with a
 * kJ→kcal fallback; nothing missing is ever invented.
 */

import { normalizeBarcode } from "../barcode";
import { G_UNIT, ML_UNIT } from "../food-data";
import type {
  BrandedProduct,
  FoodCategoryId,
  FoodServing,
  FoodUnit,
} from "../types";
import {
  OFF_CACHE_TTL,
  offBarcodeCache,
  offCacheKey,
  offSearchCache,
  offSearchCacheKey,
} from "./off-cache";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_BASE_URL = "https://world.openfoodfacts.org";

/**
 * Search-a-licious — the official OFF full-text search service — lives
 * on its own host. Stage 8C.1 migrated text search here from the legacy
 * /cgi/search.pl endpoint (recurring anonymous-access 503 outages).
 * The v3 barcode endpoint above is NOT affected by this constant.
 */
const DEFAULT_SEARCH_BASE_URL = "https://search.openfoodfacts.org";

const DEFAULT_USER_AGENT =
  "NutriTrack/0.1 (food lookup application; https://github.com/sergiotarini789-hub/NutriTrack)";

/** Requested fields — keeps the v3 response small and parsing stable. */
const FIELDS = [
  "code",
  "product_name",
  "product_name_ru",
  "generic_name",
  "brands",
  "quantity",
  "product_quantity",
  "product_quantity_unit",
  "serving_size",
  "serving_quantity",
  "nutrition_data_per",
  "nutriments",
  "image_front_url",
  "ingredients_text",
  "categories_tags",
].join(",");

const REQUEST_TIMEOUT_MS = 8000;

function baseUrl(): string {
  const fromEnv = process.env.OPEN_FOOD_FACTS_API_BASE?.trim();
  return fromEnv && /^https?:\/\//.test(fromEnv)
    ? fromEnv.replace(/\/+$/, "")
    : DEFAULT_BASE_URL;
}

/**
 * Base URL for text-search requests. Same env-var mechanism as
 * baseUrl(): a dedicated override (OPEN_FOOD_FACTS_SEARCH_API_BASE)
 * wins; otherwise the shared API override applies (e.g. a local test
 * stub serving both the v3 product and the search endpoints); otherwise
 * the Search-a-licious default.
 */
function searchBaseUrl(): string {
  const dedicated = process.env.OPEN_FOOD_FACTS_SEARCH_API_BASE?.trim();
  if (dedicated && /^https?:\/\//.test(dedicated)) {
    return dedicated.replace(/\/+$/, "");
  }
  const shared = process.env.OPEN_FOOD_FACTS_API_BASE?.trim();
  if (shared && /^https?:\/\//.test(shared)) {
    return shared.replace(/\/+$/, "");
  }
  return DEFAULT_SEARCH_BASE_URL;
}

function userAgent(): string {
  return process.env.OPEN_FOOD_FACTS_USER_AGENT?.trim() || DEFAULT_USER_AGENT;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type OffLookupResult =
  | { status: "found"; product: BrandedProduct }
  | {
      /** Product exists in OFF but carries no usable energy value. */
      status: "incomplete";
      name?: string;
      brand?: string;
      imageUrl?: string;
    }
  | { status: "not_found" }
  | { status: "error"; reason?: string };

/**
 * Parsed nutrition. `undefined` macros mean "not provided by OFF" —
 * distinct from 0, which means the nutrient is really zero.
 */
export interface OffNutrition {
  /** kcal per 100 g/ml (kJ/4.184 fallback, 1 decimal). */
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  baseUnit: "g" | "ml";
}

const round1 = (value: number) => Math.round(value * 10) / 10;

function nonNegative(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

/* ------------------------------------------------------------------ */
/* Nutrition parsing                                                   */
/* ------------------------------------------------------------------ */

/**
 * Parses per-100 nutrition from OFF nutriments.
 *
 * - kcal preferred; when only kJ exists: kcal = kJ / 4.184.
 * - baseUnit comes strictly from nutrition_data_per ("100g"/"100ml");
 *   it is never inferred from the package size.
 * - Returns null when neither kcal nor kJ exists — the product cannot
 *   be used without inventing an energy value.
 */
export function parseOffNutrition(
  nutriments: unknown,
  nutritionDataPer: unknown,
): OffNutrition | null {
  if (typeof nutriments !== "object" || nutriments === null) return null;
  const n = nutriments as Record<string, unknown>;

  const kcal = nonNegative(n["energy-kcal_100g"]);
  const kj =
    nonNegative(n["energy-kj_100g"]) ?? nonNegative(n["energy_100g"]);

  let calories: number;
  if (typeof kcal === "number") {
    calories = round1(kcal);
  } else if (typeof kj === "number" && kj > 0) {
    calories = round1(kj / 4.184);
  } else {
    return null;
  }

  return {
    calories,
    // Undefined = OFF did not provide the value (0 stays 0).
    protein: nonNegative(n["proteins_100g"]),
    fat: nonNegative(n["fat_100g"]),
    carbs: nonNegative(n["carbohydrates_100g"]),
    baseUnit: nutritionDataPer === "100ml" ? "ml" : "g",
  };
}

/* ------------------------------------------------------------------ */
/* Category mapping                                                    */
/* ------------------------------------------------------------------ */

/**
 * OFF category tags → existing NutriTrack categories. Only clear
 * mappings are listed; the taxonomy itself is never modified.
 */
const OFF_CATEGORY_TAGS: Readonly<Record<string, FoodCategoryId>> = {
  // Dairy (checked with priority — OFF often tags milks as beverages too).
  "en:dairies": "dairy",
  "en:milks": "dairy",
  "en:milks-liquid-and-powder": "dairy",
  "en:dairy-drinks": "dairy",
  "en:yogurts": "dairy",
  "en:cheeses": "dairy",
  "en:fermented-milk-products": "dairy",
  "en:dairy-desserts": "dairy",
  "en:creams": "dairy",
  // Bakery.
  "en:breads": "bakery",
  "en:crispbreads": "bakery",
  "en:toasts": "bakery",
  // Pasta.
  "en:pasta": "pasta",
  "en:noodles": "pasta",
  // Cereals.
  "en:breakfast-cereals": "cereals",
  "en:cereals": "cereals",
  "en:porridges": "cereals",
  "en:rices": "cereals",
  // Meat.
  "en:meats": "meat",
  "en:sausages": "meat",
  "en:hams": "meat",
  "en:cold-cuts": "meat",
  // Poultry.
  "en:poultry": "poultry",
  "en:poultries": "poultry",
  // Fish.
  "en:fishes": "fish",
  "en:seafood": "fish",
  "en:canned-fish": "fish",
  // Eggs.
  "en:eggs": "eggs",
  // Produce.
  "en:vegetables": "vegetables",
  "en:canned-vegetables": "vegetables",
  "en:fruits": "fruits",
  "en:berries": "berries",
  "en:nuts": "nuts",
  "en:legumes": "legumes",
  "en:beans": "legumes",
  // Oils & sauces.
  "en:vegetable-oils": "oils",
  "en:oils": "oils",
  "en:sauces": "oils",
  "en:mayonnaises": "oils",
  "en:ketchups": "oils",
  "en:tomato-sauces": "oils",
  // Drinks (fruit juices are drinks, not fruits).
  "en:beverages": "drinks",
  "en:fruit-juices": "drinks",
  "en:nectars": "drinks",
  "en:sodas": "drinks",
  "en:waters": "drinks",
  "en:teas": "drinks",
  "en:coffees": "drinks",
  // Sweets (matches the local DB: cookies, chocolate, ice cream).
  "en:sweets": "sweets",
  "en:chocolates": "sweets",
  "en:candies": "sweets",
  "en:cookies": "sweets",
  "en:biscuits": "sweets",
  "en:ice-creams": "sweets",
  // Ready products (matches the local DB: chips live here).
  "en:chipses": "ready",
  "en:salty-snacks": "ready",
};

/** Tie-break priority when several categories match equally. */
const CATEGORY_PRIORITY: readonly FoodCategoryId[] = [
  "dairy",
  "bakery",
  "pasta",
  "cereals",
  "meat",
  "poultry",
  "fish",
  "eggs",
  "vegetables",
  "fruits",
  "berries",
  "nuts",
  "legumes",
  "oils",
  "drinks",
  "sweets",
  "ready",
];

const FALLBACK_CATEGORY: FoodCategoryId = "ready";

/**
 * Maps OFF categories_tags to a NutriTrack category by majority vote
 * (OFF tags milk both "beverages" and "dairies", so a simple first
 * match would misclassify). Ambiguous or absent tags fall back to a
 * safe category instead of creating new ones.
 */
export function mapOffCategory(categoriesTags: unknown): FoodCategoryId {
  if (!Array.isArray(categoriesTags)) return FALLBACK_CATEGORY;
  const counts = new Map<FoodCategoryId, number>();
  for (const tag of categoriesTags) {
    if (typeof tag !== "string") continue;
    const mapped = OFF_CATEGORY_TAGS[tag];
    if (mapped) counts.set(mapped, (counts.get(mapped) ?? 0) + 1);
  }
  if (counts.size === 0) return FALLBACK_CATEGORY;
  let best: FoodCategoryId | null = null;
  let bestCount = 0;
  for (const category of CATEGORY_PRIORITY) {
    const count = counts.get(category) ?? 0;
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best ?? FALLBACK_CATEGORY;
}

/* ------------------------------------------------------------------ */
/* Package size / servings                                             */
/* ------------------------------------------------------------------ */

interface ParsedPackage {
  size: number;
  /** Russian unit label: "г" | "кг" | "мл" | "л". */
  unit: "г" | "кг" | "мл" | "л";
}

const PACKAGE_RE =
  /^\s*(\d+(?:[.,]\d+)?)\s*(г|g|gr|гр|кг|kg|мл|ml|л|l)\.?\s*$/i;

const PACKAGE_UNIT_MAP: Record<string, ParsedPackage["unit"]> = {
  г: "г", g: "г", gr: "г", гр: "г",
  кг: "кг", kg: "кг",
  мл: "мл", ml: "мл",
  л: "л", l: "л",
};

/**
 * Parses the package size only when it clearly matches the expected
 * "number + unit" structure (Stage 7A found unreliable quantities, so
 * anything else yields undefined). The product stays usable without it.
 */
export function parseOffPackageSize(
  quantity: unknown,
  productQuantity: unknown,
  productQuantityUnit: unknown,
): ParsedPackage | undefined {
  if (typeof quantity === "string") {
    const match = PACKAGE_RE.exec(quantity);
    if (match) {
      const size = Number(match[1].replace(",", "."));
      if (Number.isFinite(size) && size > 0 && size <= 100_000) {
        return { size, unit: PACKAGE_UNIT_MAP[match[2].toLowerCase()] };
      }
    }
  }
  if (
    typeof productQuantity === "number" &&
    Number.isFinite(productQuantity) &&
    productQuantity > 0 &&
    productQuantity <= 100_000 &&
    typeof productQuantityUnit === "string"
  ) {
    const unit = PACKAGE_UNIT_MAP[productQuantityUnit.toLowerCase()];
    if (unit) return { size: productQuantity, unit };
  }
  return undefined;
}

/** Converts a package to base units; undefined when incompatible. */
function packageToBaseUnits(
  pkg: ParsedPackage,
  baseUnit: "g" | "ml",
): number | undefined {
  if (baseUnit === "g" && (pkg.unit === "г" || pkg.unit === "кг")) {
    return pkg.unit === "кг" ? round1(pkg.size * 1000) : pkg.size;
  }
  if (baseUnit === "ml" && (pkg.unit === "мл" || pkg.unit === "л")) {
    return pkg.unit === "л" ? round1(pkg.size * 1000) : pkg.size;
  }
  // Mass↔volume would need a density — never invented.
  return undefined;
}

/**
 * Reliable serving in base units, or undefined. Guards follow Stage 7A:
 * OFF often sets serving = the whole package («930 ml»), which is not a
 * useful serving, so equal-to-package and oversized values are ignored.
 */
function reliableServingBase(
  servingQuantity: unknown,
  servingSize: unknown,
  packageBase: number | undefined,
): number | undefined {
  if (typeof servingQuantity !== "number") return undefined;
  if (!Number.isFinite(servingQuantity) || servingQuantity <= 0) return undefined;
  if (servingQuantity > 500) return undefined;
  if (typeof servingSize !== "string" || !/\d/.test(servingSize)) return undefined;
  if (packageBase !== undefined && servingQuantity >= packageBase) return undefined;
  return round1(servingQuantity);
}

/* ------------------------------------------------------------------ */
/* Product normalization                                               */
/* ------------------------------------------------------------------ */

function bestName(product: Record<string, unknown>): string | undefined {
  for (const key of ["product_name_ru", "product_name", "generic_name"]) {
    const value = product[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim().slice(0, 120);
    }
  }
  return undefined;
}

function bestBrand(product: Record<string, unknown>): string | undefined {
  if (typeof product.brands !== "string" || !product.brands.trim()) return undefined;
  // First comma-separated brand; never invented from the product name.
  const first = product.brands.split(",")[0].trim();
  return first ? first.slice(0, 80) : undefined;
}

function codeMatches(returnedCode: unknown, normalizedBarcode: string): boolean {
  if (typeof returnedCode !== "string" || !returnedCode) return false;
  if (returnedCode === normalizedBarcode) return true;
  // OFF keeps leading zeros ("0099…"); compare zero-stripped as well.
  const strip = (value: string) => value.replace(/^0+(?=\d)/, "");
  return strip(returnedCode) === strip(normalizedBarcode);
}

/**
 * Converts a v3 product response into the Stage 6 BrandedProduct model.
 *
 * Missing optional fields stay undefined — they are never invented.
 * Missing macros are flattened to 0 in the persisted model when the
 * product HAS nutrition (the parser's OffNutrition keeps them
 * undefined; see parseOffNutrition), matching how the existing model
 * represents unspecified macros. When the product has NO energy data at
 * all, the default behavior rejects it (barcode flow: "incomplete");
 * text search (Stage 8B) passes allowMissingNutrition so the product
 * can still be listed with undefined nutrition fields — unknown is
 * never the same as a real 0.
 */
export function normalizeOffProduct(
  raw: unknown,
  normalizedBarcode: string,
  options?: { allowMissingNutrition?: boolean },
):
  | { ok: true; product: BrandedProduct }
  | {
      ok: false;
      reason: "code_mismatch" | "no_nutrition";
      partial?: { name?: string; brand?: string; imageUrl?: string };
    } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, reason: "code_mismatch" };
  }
  const response = raw as Record<string, unknown>;

  if (response.status !== "success") return { ok: false, reason: "code_mismatch" };
  const product = response.product;
  if (typeof product !== "object" || product === null) {
    return { ok: false, reason: "code_mismatch" };
  }
  const p = product as Record<string, unknown>;

  // Barcode identity is the primary signal — verify it.
  if (
    !codeMatches(response.code, normalizedBarcode) &&
    !codeMatches(p.code, normalizedBarcode)
  ) {
    return { ok: false, reason: "code_mismatch" };
  }

  const partial = {
    name: bestName(p),
    brand: bestBrand(p),
    imageUrl:
      typeof p.image_front_url === "string" &&
      /^https?:\/\//.test(p.image_front_url)
        ? p.image_front_url
        : undefined,
  };

  const nutrition = parseOffNutrition(p.nutriments, p.nutrition_data_per);
  if (!nutrition && !options?.allowMissingNutrition) {
    // No kcal and no kJ: the energy value must not be invented.
    return { ok: false, reason: "no_nutrition", partial };
  }

  const baseUnit: "g" | "ml" = nutrition
    ? nutrition.baseUnit
    : p.nutrition_data_per === "100ml"
      ? "ml"
      : "g";
  const units: FoodUnit[] = [baseUnit === "ml" ? ML_UNIT : G_UNIT];
  const servingOptions: FoodServing[] =
    baseUnit === "ml"
      ? [
          { amount: 100, unitKey: "ml" },
          { amount: 200, unitKey: "ml" },
          { amount: 250, unitKey: "ml" },
        ]
      : [
          { amount: 50, unitKey: "g" },
          { amount: 100, unitKey: "g" },
          { amount: 150, unitKey: "g" },
        ];

  // Optional package unit (only when compatible with the base unit).
  const pkg = parseOffPackageSize(
    p.quantity,
    p.product_quantity,
    p.product_quantity_unit,
  );
  const packageBase = pkg ? packageToBaseUnits(pkg, baseUnit) : undefined;
  if (packageBase && packageBase > 0 && packageBase <= 100_000) {
    units.push({
      key: "package",
      kind: "package",
      label: "упаковка",
      few: "упаковки",
      many: "упаковок",
      base: packageBase,
    });
  }

  // Optional serving (quick pick only — never the whole package).
  const servingBase = reliableServingBase(
    p.serving_quantity,
    p.serving_size,
    packageBase,
  );
  if (
    servingBase &&
    !servingOptions.some(
      (serving) => serving.unitKey === baseUnit && serving.amount === servingBase,
    )
  ) {
    servingOptions.push({ amount: servingBase, unitKey: baseUnit });
  }

  const now = new Date().toISOString();
  const ingredients =
    typeof p.ingredients_text === "string" && p.ingredients_text.trim()
      ? p.ingredients_text.trim().slice(0, 500)
      : undefined;

  return {
    ok: true,
    product: {
      type: "branded",
      id: `off-${normalizedBarcode}`,
      name: partial.name ?? "Продукт без названия",
      category: mapOffCategory(p.categories_tags),
      aliases: [],
      // Flat per-100 values. With nutrition: missing macros flatten to
      // 0 (documented). Without nutrition (search listing): all four
      // stay undefined — "unknown", never a fake zero.
      calories: nutrition?.calories,
      protein: nutrition ? (nutrition.protein ?? 0) : undefined,
      fat: nutrition ? (nutrition.fat ?? 0) : undefined,
      carbs: nutrition ? (nutrition.carbs ?? 0) : undefined,
      baseUnit,
      units,
      servingOptions,
      defaultServing: { amount: 100, unitKey: baseUnit },
      sourceType: "open_food_facts",
      sourceName: undefined,
      sourceId: normalizedBarcode,
      isBranded: true,
      brand: partial.brand,
      manufacturer: undefined,
      barcode: normalizedBarcode,
      ingredients,
      packageSize: pkg?.size,
      packageUnit: pkg?.unit,
      imageUrl: partial.imageUrl,
      verified: false,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function buildOffUrl(normalizedBarcode: string): string {
  return (
    `${baseUrl()}/api/v3/product/${encodeURIComponent(normalizedBarcode)}.json` +
    `?fields=${FIELDS}&lc=ru&cc=ru`
  );
}

/**
 * Performs ONE request per barcode (no retries, no parallelism).
 * Classifies the outcome explicitly; network failures, HTTP errors,
 * invalid JSON and unexpected shapes all become "error" — never
 * "not_found".
 */
export async function fetchOffProductByBarcode(
  normalizedBarcode: string,
): Promise<OffLookupResult> {
  let response: Response;
  try {
    response = await fetch(buildOffUrl(normalizedBarcode), {
      headers: {
        "User-Agent": userAgent(),
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // One-shot lookups should not pollute any caches upstream.
      cache: "no-store",
    });
  } catch (error) {
    return { status: "error", reason: error instanceof Error ? error.message : "network" };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (response.status === 404) {
      // Some deployments answer 404 without a body for missing products.
      return { status: "not_found" };
    }
    return { status: "error", reason: `http-${response.status}` };
  }

  if (typeof body !== "object" || body === null) {
    return { status: "error", reason: "unexpected-body" };
  }
  const data = body as Record<string, unknown>;

  const resultId =
    typeof data.result === "object" && data.result !== null
      ? (data.result as Record<string, unknown>).id
      : undefined;
  const notFound =
    resultId === "product_not_found" ||
    (Array.isArray(data.errors) &&
      data.errors.some((error) => {
        if (typeof error !== "object" || error === null) return false;
        const message = (error as Record<string, unknown>).message;
        if (message === "product_not_found") return true;
        // v3 wraps the message id in an object: {id: "product_not_found"}.
        return (
          typeof message === "object" &&
          message !== null &&
          (message as Record<string, unknown>).id === "product_not_found"
        );
      }));

  if (notFound) return { status: "not_found" };
  if (data.status !== "success") return { status: "error", reason: "unexpected-status" };

  const normalized = normalizeOffProduct(data, normalizedBarcode);
  if (normalized.ok) return { status: "found", product: normalized.product };
  if (normalized.reason === "no_nutrition") {
    // The product exists but has no energy data — report it honestly
    // instead of pretending it is missing or that the request failed.
    return {
      status: "incomplete",
      name: normalized.partial?.name,
      brand: normalized.partial?.brand,
      imageUrl: normalized.partial?.imageUrl,
    };
  }
  // Barcode identity could not be verified — unexpected response.
  return { status: "error", reason: "code-mismatch" };
}

/** In-flight request dedup: one network request per barcode at a time. */
const inFlight = new Map<string, Promise<OffLookupResult>>();

/**
 * Cached barcode lookup used by the API route: cache → in-flight
 * dedupe → single OFF request. Successful and not-found results are
 * cached with different TTLs; errors are NOT cached so the user can
 * retry immediately.
 */
export async function lookupOffBarcode(
  normalizedBarcode: string,
): Promise<OffLookupResult> {
  const key = offCacheKey(normalizedBarcode);
  const cached = offBarcodeCache.get(key);
  if (cached) {
    if (cached.status === "found") {
      return { status: "found", product: cached.product as BrandedProduct };
    }
    if (cached.status === "incomplete") {
      return {
        status: "incomplete",
        name: cached.partial?.name,
        brand: cached.partial?.brand,
        imageUrl: cached.partial?.imageUrl,
      };
    }
    return { status: "not_found" };
  }

  const existing = inFlight.get(normalizedBarcode);
  if (existing) return existing;

  const request = (async () => {
    const result = await fetchOffProductByBarcode(normalizedBarcode);
    if (result.status === "found") {
      offBarcodeCache.set(
        key,
        { status: "found", product: result.product },
        OFF_CACHE_TTL.found,
      );
    } else if (result.status === "incomplete") {
      offBarcodeCache.set(
        key,
        {
          status: "incomplete",
          partial: {
            name: result.name,
            brand: result.brand,
            imageUrl: result.imageUrl,
          },
        },
        OFF_CACHE_TTL.notFound,
      );
    } else if (result.status === "not_found") {
      offBarcodeCache.set(key, { status: "not_found" }, OFF_CACHE_TTL.notFound);
    }
    // Errors are not cached: the user may retry immediately.
    return result;
  })();

  inFlight.set(normalizedBarcode, request);
  try {
    return await request;
  } finally {
    inFlight.delete(normalizedBarcode);
  }
}

/** Test helper: forget everything cached. */
export function resetOffStateForTests(): void {
  offBarcodeCache.clear();
  offSearchCache.clear();
  inFlight.clear();
  inFlightSearch.clear();
}

/* ------------------------------------------------------------------ */
/* Text search (Stage 8B)                                              */
/* ------------------------------------------------------------------ */

export type OffSearchResult =
  | { status: "ok"; products: BrandedProduct[] }
  | { status: "empty" }
  | { status: "error"; reason?: string };

/** Results per search page — enough to be useful, never the whole DB. */
export const OFF_SEARCH_PAGE_SIZE = 20;

/**
 * True when the raw OFF product carries a usable name. Search listings
 * skip nameless records (the barcode flow still shows them with a
 * placeholder — different feature, kept unchanged).
 */
export function hasOffUsableName(rawProduct: unknown): boolean {
  if (typeof rawProduct !== "object" || rawProduct === null) return false;
  return bestName(rawProduct as Record<string, unknown>) !== undefined;
}

/**
 * Builds the OFF text-search request against Search-a-licious
 * (`GET https://search.openfoodfacts.org/search`, verified live
 * 2026-09-18). The legacy `/cgi/search.pl` endpoint showed recurring
 * anonymous-access 503 outages and is "not recommended for new
 * integrations" per the official API cheat sheet. Search-a-licious
 * hits carry the same per-product field names as the v3 endpoint
 * (minus fields the search index does not store), so the existing
 * normalization layer applies behind a small envelope/shape adapter in
 * searchOffProducts.
 */
export function buildOffSearchUrl(query: string, page: number): string {
  const params = new URLSearchParams({
    q: query,
    langs: "ru",
    fields: FIELDS,
    page_size: String(OFF_SEARCH_PAGE_SIZE),
    page: String(page),
  });
  return `${searchBaseUrl()}/search?${params.toString()}`;
}

/**
 * Bare search-result product → the v3 response envelope the
 * normalizer already understands.
 */
function asProductEnvelope(item: unknown): unknown {
  if (typeof item !== "object" || item === null) return null;
  const p = item as Record<string, unknown>;
  return { status: "success", code: p.code, product: p };
}

/**
 * Search-a-licious returns `brands` as an ARRAY of strings, while the
 * v3/legacy field (and bestBrand) expect a comma-joined string. This
 * adapter is the one compatibility boundary: arrays are joined, any
 * other shape (string, missing) passes through untouched — never a
 * crash, never an invented brand.
 */
function adaptSearchHit(item: unknown): unknown {
  if (typeof item !== "object" || item === null) return item;
  const hit = item as Record<string, unknown>;
  if (Array.isArray(hit.brands)) {
    return { ...hit, brands: hit.brands.join(",") };
  }
  return hit;
}

/**
 * Fetches and normalizes one page of Search-a-licious results.
 *
 * The envelope differs from the legacy API: results live in `hits[]`
 * (not `products[]`) and `brands` arrives as an array — adaptSearchHit
 * is the boundary. Everything else reuses the existing pipeline.
 *
 * Robustness rules mirror the barcode path: network failures, HTTP
 * errors (Search-a-licious answers 400/422 with FastAPI "detail"
 * bodies and 500s with plain HTML), invalid JSON and unexpected shapes
 * become "error" — never "empty". Products that cannot be identified
 * (no usable barcode code) or have no usable name are skipped, not
 * guessed. Nutritionless products are kept (with undefined nutrition)
 * so the UI can show «Нет данных о КБЖУ».
 */
export async function searchOffProducts(
  query: string,
  page: number,
): Promise<OffSearchResult> {
  let response: Response;
  try {
    response = await fetch(buildOffSearchUrl(query, page), {
      headers: {
        "User-Agent": userAgent(),
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof Error ? error.message : "network",
    };
  }

  // Search-a-licious errors (400/422 FastAPI "detail" JSON, 500 HTML)
  // are classified by status up front — an upstream failure is never
  // mistaken for an empty result.
  if (!response.ok) {
    return { status: "error", reason: `http-${response.status}` };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { status: "error", reason: `http-${response.status}` };
  }
  if (typeof body !== "object" || body === null) {
    return { status: "error", reason: "unexpected-body" };
  }
  const data = body as Record<string, unknown>;

  const hitsRaw = data.hits;
  if (!Array.isArray(hitsRaw)) {
    // An empty search may omit the hits array entirely.
    if (data.count === 0) return { status: "empty" };
    return { status: "error", reason: "unexpected-shape" };
  }

  const products: BrandedProduct[] = [];
  const seenIds = new Set<string>();
  for (const hit of hitsRaw) {
    const rawCode =
      typeof hit === "object" && hit !== null
        ? (hit as Record<string, unknown>).code
        : undefined;
    const code =
      typeof rawCode === "string" ? normalizeBarcode(rawCode) : undefined;
    if (!code) continue; // identity is the barcode — skip unusable
    const item = adaptSearchHit(hit); // brands array → legacy string
    if (!hasOffUsableName(item)) continue; // nothing to display
    const normalized = normalizeOffProduct(asProductEnvelope(item), code, {
      allowMissingNutrition: true,
    });
    if (!normalized.ok) continue; // code mismatch inside OFF itself
    if (seenIds.has(normalized.product.id)) continue; // same barcode twice
    seenIds.add(normalized.product.id);
    products.push(normalized.product);
  }

  if (products.length === 0) {
    // Nothing survived normalization (or OFF genuinely has no matches):
    // an honest empty result, not an error.
    return { status: "empty" };
  }
  return { status: "ok", products };
}

/** In-flight request dedupe: one network request per query+page. */
const inFlightSearch = new Map<string, Promise<OffSearchResult>>();

/**
 * Cached text search used by the search API route: cache → in-flight
 * dedupe → single OFF request. Successful results are cached for 24 h,
 * empty results for 1 h (like barcode negatives); errors are never
 * cached so the user can retry immediately.
 */
export async function lookupOffSearch(
  query: string,
  page: number,
): Promise<OffSearchResult> {
  const key = offSearchCacheKey(query, page);
  const cached = offSearchCache.get(key);
  if (cached) {
    return cached.products.length === 0
      ? { status: "empty" }
      : { status: "ok", products: cached.products as BrandedProduct[] };
  }

  const flightKey = `${key}|inflight`;
  const existing = inFlightSearch.get(flightKey);
  if (existing) return existing;

  const request = (async () => {
    const result = await searchOffProducts(query, page);
    if (result.status === "ok") {
      offSearchCache.set(
        key,
        { products: result.products },
        OFF_CACHE_TTL.search,
      );
    } else if (result.status === "empty") {
      offSearchCache.set(key, { products: [] }, OFF_CACHE_TTL.notFound);
    }
    // Errors are not cached: the user may retry immediately.
    return result;
  })();

  inFlightSearch.set(flightKey, request);
  try {
    return await request;
  } finally {
    inFlightSearch.delete(flightKey);
  }
}
