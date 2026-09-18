/**
 * Stage 8B tests — server-side OFF text search.
 *
 * OFF network access is fully MOCKED (vi.stubGlobal fetch); payloads
 * are the REAL captured search responses from fixtures.ts plus
 * synthetic edge cases. These tests cover: normalization through the
 * existing layer, empty results, timeouts, HTTP errors, malformed
 * responses, dedup within a page, caching and cache expiration.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOffSearchUrl,
  lookupOffSearch,
  resetOffStateForTests,
  searchOffProducts,
} from "../openfoodfacts";
import { SEARCH_DANISSIMO, SEARCH_EDGE_CASES } from "./fixtures";

/** Installs a fetch mock and returns a call recorder. */
function mockFetch(
  handler: (url: string) => { status: number; body?: unknown; raw?: string } | null,
) {
  const calls: string[] = [];
  const spy = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const result = handler(url);
    if (result === null) {
      return new Response(JSON.stringify({ count: 0, products: [] }), {
        status: 200,
      });
    }
    if (result.raw !== undefined) {
      return new Response(result.raw, { status: result.status });
    }
    return new Response(JSON.stringify(result.body ?? {}), {
      status: result.status,
    });
  });
  vi.stubGlobal("fetch", spy);
  return { calls, spy };
}

beforeEach(() => {
  resetOffStateForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("buildOffSearchUrl", () => {
  it("targets the official Search API with the documented parameters", () => {
    const url = buildOffSearchUrl("даниссимо", 2);
    expect(url.startsWith("https://world.openfoodfacts.org/cgi/search.pl?")).toBe(
      true,
    );
    expect(url).toContain("search_terms=%D0%B4%D0%B0%D0%BD%D0%B8%D1%81%D1%81%D0%B8%D0%BC%D0%BE");
    expect(url).toContain("search_simple=1");
    expect(url).toContain("action=process");
    expect(url).toContain("json=1");
    expect(url).toContain("page_size=20");
    expect(url).toContain("page=2");
    expect(url).toContain("lc=ru");
    expect(url).toContain("cc=ru");
    expect(url).toContain("fields=");
  });

  it("honors the base URL override (used by tests/ops)", () => {
    process.env.OPEN_FOOD_FACTS_API_BASE = "http://127.0.0.1:3001";
    const url = buildOffSearchUrl("молоко", 1);
    expect(url).toContain("http://127.0.0.1:3001/cgi/search.pl?");
    delete process.env.OPEN_FOOD_FACTS_API_BASE;
  });
});

describe("searchOffProducts", () => {
  it("normalizes the REAL captured search page through the existing layer", async () => {
    const { calls } = mockFetch(() => ({
      status: 200,
      body: SEARCH_DANISSIMO,
    }));
    const result = await searchOffProducts("даниссимо", 1);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.products).toHaveLength(2);

    const first = result.products[0];
    expect(first.id).toBe("off-4600605019351");
    expect(first.type).toBe("branded");
    expect(first.sourceType).toBe("open_food_facts");
    expect(first.name).toBe("Йогурт с шариками в шоколаде");
    expect(first.brand).toBe("Даниссимо");
    expect(first.calories).toBe(123);
    expect(first.protein).toBe(3.3);
    expect(first.fat).toBe(6.9);
    expect(first.carbs).toBe(11.9);
    expect(first.baseUnit).toBe("g");
    expect(first.category).toBe("dairy");
    expect(first.packageSize).toBe(105);
    expect(first.packageUnit).toBe("г");
    expect(first.barcode).toBe("4600605019351");
    expect(first.verified).toBe(false);
    expect(calls[0]).toContain("/cgi/search.pl?");

    const second = result.products[1];
    expect(second.id).toBe("off-4600605021781");
    expect(second.brand).toBe("Danone");
    expect(second.calories).toBe(120.9);
    // "105 г (93 г йогурт и 12 г наполнитель)" fails the strict parser,
    // but product_quantity=105 g still yields a package size.
    expect(second.packageSize).toBe(105);
  });

  it("skips nameless and unusable records, keeps nutritionless ones, dedupes by barcode", async () => {
    mockFetch(() => ({ status: 200, body: SEARCH_EDGE_CASES }));
    const result = await searchOffProducts("бренд", 1);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.products).toHaveLength(2);

    const nutritionless = result.products[0];
    expect(nutritionless.id).toBe("off-4602222222222");
    expect(nutritionless.name).toBe("Продукт без КБЖУ");
    // Unknown nutrition stays undefined — never a fake zero.
    expect(nutritionless.calories).toBeUndefined();
    expect(nutritionless.protein).toBeUndefined();
    expect(nutritionless.fat).toBeUndefined();
    expect(nutritionless.carbs).toBeUndefined();
    expect(nutritionless.baseUnit).toBe("g");

    // Duplicate barcode appears once (first record wins).
    const dup = result.products[1];
    expect(dup.id).toBe("off-4603333333333");
    expect(dup.name).toBe("Дубликат один");
    expect(result.products.filter((p) => p.id === dup.id)).toHaveLength(1);
  });

  it("reports an honest empty result when OFF has no matches", async () => {
    mockFetch(() => ({ status: 200, body: { count: 0, products: [] } }));
    const result = await searchOffProducts("ыввцук", 1);
    expect(result).toEqual({ status: "empty" });
  });

  it("treats a missing products array with count 0 as empty", async () => {
    mockFetch(() => ({ status: 200, body: { count: 0 } }));
    const result = await searchOffProducts("ыввцук", 1);
    expect(result).toEqual({ status: "empty" });
  });

  it("maps HTTP errors to error (never empty)", async () => {
    mockFetch(() => ({ status: 503, raw: "Page temporarily unavailable" }));
    const result = await searchOffProducts("даниссимо", 1);
    expect(result.status).toBe("error");
  });

  it("maps invalid JSON to error", async () => {
    mockFetch(() => ({ status: 200, raw: "not json at all" }));
    const result = await searchOffProducts("даниссимо", 1);
    expect(result.status).toBe("error");
  });

  it("maps network failures/timeouts to error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("This operation was aborted");
      }),
    );
    const result = await searchOffProducts("даниссимо", 1);
    expect(result.status).toBe("error");
  });

  it("maps an unexpected body shape to error (not empty)", async () => {
    mockFetch(() => ({ status: 200, body: { hello: "world" } }));
    const result = await searchOffProducts("молоко", 1);
    expect(result.status).toBe("error");
  });

  it("reports empty when products exist but none survive normalization", async () => {
    mockFetch(() => ({
      status: 200,
      body: {
        count: 2,
        products: [{ code: "123", brands: "X" }, { code: "", product_name: "Y" }],
      },
    }));
    const result = await searchOffProducts("x", 1);
    expect(result).toEqual({ status: "empty" });
  });
});

describe("lookupOffSearch caching", () => {
  it("fetches once for a repeated query (cache hit)", async () => {
    const { calls } = mockFetch(() => ({
      status: 200,
      body: SEARCH_DANISSIMO,
    }));
    const first = await lookupOffSearch("даниссимо", 1);
    const second = await lookupOffSearch("даниссимо", 1);
    expect(first.status).toBe("ok");
    expect(second.status).toBe("ok");
    expect(calls).toHaveLength(1);
  });

  it("caches per query and page", async () => {
    const { calls } = mockFetch(() => ({
      status: 200,
      body: SEARCH_DANISSIMO,
    }));
    await lookupOffSearch("даниссимо", 1);
    await lookupOffSearch("даниссимо", 2);
    await lookupOffSearch("агуша", 1);
    expect(calls).toHaveLength(3);
  });

  it("normalizes equivalent queries to one cache entry", async () => {
    const { calls } = mockFetch(() => ({
      status: 200,
      body: SEARCH_DANISSIMO,
    }));
    await lookupOffSearch("даниссимо", 1);
    await lookupOffSearch("  Даниссимо ", 1);
    expect(calls).toHaveLength(1);
  });

  it("never caches errors — retry hits OFF again", async () => {
    let failures = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        failures += 1;
        return new Response("boom", { status: 502 });
      }),
    );
    const first = await lookupOffSearch("молоко", 1);
    const second = await lookupOffSearch("молоко", 1);
    expect(first.status).toBe("error");
    expect(second.status).toBe("error");
    expect(failures).toBe(2);
  });

  it("expires cached search results after the TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T12:00:00Z"));
    const { calls } = mockFetch(() => ({
      status: 200,
      body: SEARCH_DANISSIMO,
    }));
    await lookupOffSearch("даниссимо", 1);
    expect(calls).toHaveLength(1);

    vi.advanceTimersByTime(23 * 60 * 60 * 1000); // still fresh
    await lookupOffSearch("даниссимо", 1);
    expect(calls).toHaveLength(1);

    vi.advanceTimersByTime(2 * 60 * 60 * 1000); // 25h total → expired
    await lookupOffSearch("даниссимо", 1);
    expect(calls).toHaveLength(2);
  });

  it("deduplicates concurrent identical searches (in-flight)", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const spy = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", spy);
    const first = lookupOffSearch("кефир", 1);
    const second = lookupOffSearch("кефир", 1);
    resolveFetch(new Response(JSON.stringify(SEARCH_DANISSIMO), { status: 200 }));
    const [a, b] = await Promise.all([first, second]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(a.status).toBe("ok");
    expect(b.status).toBe("ok");
  });
});
