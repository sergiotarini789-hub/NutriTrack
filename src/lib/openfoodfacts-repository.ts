import { normalizeBarcode } from "./barcode";
import type { BarcodeLookupResult, BrandedProduct } from "./types";

/**
 * Open Food Facts repository (client side, Stage 7).
 *
 * Implements ExternalFoodSource by calling OUR server proxy route
 * (/api/foods/barcode/…) — the browser never contacts Open Food
 * Facts directly and never sees the external URL or response shape.
 * The route returns already-normalized NutriTrack products.
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
}
