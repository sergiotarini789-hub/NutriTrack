import { normalizeBarcode } from "./barcode";
import type { BarcodeLookupResult, BrandedProduct } from "./types";

/**
 * Open Food Facts repository (client side, Stage 7; text search added
 * in Stage 8B).
 *
 * Implements ExternalFoodSource by calling OUR server proxy routes
 * (/api/foods/barcode/…, /api/foods/search) — the browser never
 * contacts Open Food Facts directly and never sees the external URL or
 * response shape. The routes return already-normalized NutriTrack
 * products.
 *
 * Resolution order for the user-facing lookup lives in the diary
 * provider (local repository → cached OFF products → this class), so
 * a UserProduct with the same barcode always wins over OFF data.
 */

const REQUEST_TIMEOUT_MS = 12_000;

interface RouteFound {
  status: "found";
  product: BrandedProduct;
}
type RouteResponse =
  | RouteFound
  | { status: "not_found" }
  | { status: "incomplete"; name?: string; brand?: string }
  | { status: "error" };

/** Result of a remote text search (Stage 8B). */
export type OffSearchResponse =
  | { status: "ok"; products: BrandedProduct[] }
  | { status: "empty" }
  | { status: "error" };

/** Combines the request timeout with an optional cancellation signal. */
function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  if (!signal) return timeout;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeout]);
  }
  return timeout;
}

export class OpenFoodFactsRepository {
  /** Looks a barcode up via the server proxy route. */
  async getByBarcode(barcode: string): Promise<BarcodeLookupResult> {
    const normalized = normalizeBarcode(barcode);
    if (!normalized) return { status: "invalid" };

    let response: Response;
    try {
      response = await fetch(
        `/api/foods/barcode/${encodeURIComponent(normalized)}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch {
      // Network failure is an ERROR — the product may well exist.
      return { status: "error" };
    }

    let data: RouteResponse | null = null;
    try {
      data = (await response.json()) as RouteResponse;
    } catch {
      return { status: "error" };
    }

    if (data && data.status === "found" && data.product) {
      return { status: "found", product: data.product, origin: "external" };
    }
    if (data && data.status === "not_found") return { status: "not_found" };
    if (data && data.status === "incomplete") {
      return { status: "incomplete", name: data.name, brand: data.brand };
    }
    return { status: "error" };
  }

  /**
   * Full-text product search via the server proxy route (Stage 8B).
   * The query is validated server-side; a cancellation signal lets the
   * caller ignore stale requests. Network/parse failures and non-OK
   * responses become "error" — never "empty".
   */
  async search(query: string, signal?: AbortSignal): Promise<OffSearchResponse> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return { status: "empty" };

    let response: Response;
    try {
      response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(trimmed)}`,
        { headers: { Accept: "application/json" }, signal: withTimeout(signal) },
      );
    } catch {
      // Offline, aborted or timed out — a technical failure.
      return { status: "error" };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { status: "error" };
    }

    if (
      data &&
      typeof data === "object" &&
      (data as { status?: unknown }).status === "ok" &&
      Array.isArray((data as { products?: unknown }).products)
    ) {
      return {
        status: "ok",
        products: (data as { products: BrandedProduct[] }).products,
      };
    }
    if (
      data &&
      typeof data === "object" &&
      (data as { status?: unknown }).status === "empty"
    ) {
      return { status: "empty" };
    }
    return { status: "error" };
  }
}
