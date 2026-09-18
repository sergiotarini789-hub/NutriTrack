import { lookupOffSearch } from "@/lib/server/openfoodfacts";

/**
 * Server-side food text-search proxy (Stage 8B):
 *
 *   GET /api/foods/search?q=<query>&page=<page>
 *
 * The browser never talks to Open Food Facts directly — this route
 * validates the query, consults the server-side search cache and
 * performs a single OFF Search API request. Only normalized NutriTrack
 * products are returned; raw OFF payloads never reach the client.
 *
 * Responses:
 *   200 { status: "ok", products: BrandedProduct[] }
 *   200 { status: "empty" }
 *   502 { status: "error" }     — technical failure
 *   400 { status: "invalid" }   — unusable query or page
 */

/** Queries shorter than this are served by local search alone. */
const MIN_QUERY_LENGTH = 2;
/** Guard against absurd inputs; real product queries are far shorter. */
const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 20;

/** Trims and collapses inner whitespace without altering the text itself. */
function normalizeQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = normalizeQuery(url.searchParams.get("q") ?? "");
  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return Response.json({ status: "invalid" }, { status: 400 });
  }

  const rawPage = url.searchParams.get("page");
  let page = 1;
  if (rawPage !== null) {
    const parsed = Number(rawPage);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE) {
      return Response.json({ status: "invalid" }, { status: 400 });
    }
    page = parsed;
  }

  const result = await lookupOffSearch(query, page);

  switch (result.status) {
    case "ok":
      return Response.json({ status: "ok", products: result.products });
    case "empty":
      return Response.json({ status: "empty" });
    default:
      return Response.json({ status: "error" }, { status: 502 });
  }
}
