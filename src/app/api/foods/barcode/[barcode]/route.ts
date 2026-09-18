import { normalizeBarcode } from "@/lib/barcode";
import { lookupOffBarcode } from "@/lib/server/openfoodfacts";

/**
 * Server-side barcode lookup proxy (Stage 7):
 *
 *   GET /api/foods/barcode/{barcode}
 *
 * The browser never talks to Open Food Facts directly — this route
 * validates the barcode, consults the server-side cache and performs a
 * single OFF v3 request. The only external endpoint ever requested is
 * the official OFF product endpoint (built by the server module); no
 * client-supplied URLs are accepted.
 *
 * Responses (normalized NutriTrack data only, never raw OFF payloads):
 *   200 { status: "found", product: BrandedProduct }
 *   200 { status: "not_found" }                     — OFF has no such product
 *   200 { status: "incomplete", name?, brand? }     — exists, no nutrition data
 *   502 { status: "error" }                          — technical failure
 *   400 { status: "invalid" }                        — not a usable barcode
 */

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ barcode: string }> },
): Promise<Response> {
  const { barcode } = await context.params;
  const normalized = normalizeBarcode(decodeURIComponent(barcode));
  if (!normalized) {
    return Response.json({ status: "invalid" }, { status: 400 });
  }

  const result = await lookupOffBarcode(normalized);

  switch (result.status) {
    case "found":
      return Response.json({ status: "found", product: result.product });
    case "not_found":
      return Response.json({ status: "not_found" });
    case "incomplete":
      return Response.json({
        status: "incomplete",
        name: result.name,
        brand: result.brand,
      });
    default:
      return Response.json({ status: "error" }, { status: 502 });
  }
}
