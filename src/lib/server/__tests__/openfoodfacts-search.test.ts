/**
 * Stage 8C tests — server-side OFF text search (Search-a-licious).
 *
 * OFF network access is fully MOCKED (vi.stubGlobal fetch); payloads
 * are the REAL captured Search-a-licious responses from fixtures.ts
 * (даниссимо pages 1 and 4, макфа, молоко, данон) plus synthetic edge
 * cases. These tests cover: the new upstream URL, the hits[] envelope,
 * the brands-array adapter, normalization through the existing layer
 * (incl. kJ-only conversion and unknown ≠ zero nutrition), empty
 * results, HTTP/FastAPI errors, malformed responses, dedup within a
 * page, caching and cache expiration.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOffSearchUrl,
  lookupOffSearch,
  resetOffStateForTests,
  searchOffProducts,
} from "../openfoodfacts";
import {
  SEARCH_DANISSIMO,
  SEARCH_DANISSIMO_PAGE4,
  SEARCH_DANON,
  SEARCH_EDGE_CASES,
  SEARCH_MACFA,
  SEARCH_MOLOKO,
} from "./fixtures";

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
      return new Response(JSON.stringify({ count: 0, hits: [] }), {
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
  delete process.env.OPEN_FOOD_FACTS_API_BASE;
  delete process.env.OPEN_FOOD_FACTS_SEARCH_API_BASE;
});

describe("buildOffSearchUrl", () => {
  it("targets Search-a-licious with the documented parameters", () => {
    const url = buildOffSearchUrl("даниссимо", 2);
    expect(url.startsWith("https://search.openfoodfacts.org/search?")).toBe(
      true,
    );
    expect(url).toContain("q=%D0%B4%D0%B0%D0%BD%D0%B8%D1%81%D1%81%D0%B8%D0%BC%D0%BE");
    expect(url).toContain("langs=ru");
    expect(url).toContain("page_size=20");
    expect(url).toContain("page=2");
    expect(url).toContain("fields=code%2Cproduct_name%2Cproduct_name_ru");
    // Legacy-only parameters are gone.
    expect(url).not.toContain("search_terms");
    expect(url).not.toContain("action=process");
    expect(url).not.toContain("lc=ru");
  });

  it("honors the shared base URL override (used by tests/ops)", () => {
    process.env.OPEN_FOOD_FACTS_API_BASE = "http://127.0.0.1:3001";
    const url = buildOffSearchUrl("молоко", 1);
    expect(url).toContain("http://127.0.0.1:3001/search?");
    expect(url).not.toContain("world.openfoodfacts.org");
    expect(url).not.toContain("search.openfoodfacts.org");
  });

  it("honors the dedicated search base override with precedence", () => {
    process.env.OPEN_FOOD_FACTS_API_BASE = "http://127.0.0.1:3001";
    process.env.OPEN_FOOD_FACTS_SEARCH_API_BASE = "http://127.0.0.1:3002";
    const url = buildOffSearchUrl("молоко", 1);
    expect(url).toContain("http://127.0.0.1:3002/search?");
  });
});

describe("searchOffProducts", () => {
  it("normalizes the REAL captured даниссимо page through the existing layer", async () => {
    const { calls } = mockFetch(() => ({
      status: 200,
      body: SEARCH_DANISSIMO,
    }));
    const result = await searchOffProducts("даниссимо", 1);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.products).toHaveLength(5);
    expect(calls[0]).toContain("/search?");

    // Hit 1: full nutrition, brands as ARRAY, "130 g" quantity string.
    const first = result.products[0];
    expect(first.id).toBe("off-4600605017333");
    expect(first.type).toBe("branded");
    expect(first.sourceType).toBe("open_food_facts");
    expect(first.name).toBe("Даниссимо Творожный с изысканным шоколадом");
    // ["Даниссимо"] → "Даниссимо" via the adapter + bestBrand.
    expect(first.brand).toBe("Даниссимо");
    expect(first.calories).toBe(152);
    expect(first.protein).toBe(5.6);
    expect(first.fat).toBe(6.7);
    expect(first.carbs).toBe(17.4);
    expect(first.baseUnit).toBe("g");
    // ru:-only categories are not in the mapping → safe fallback.
    expect(first.category).toBe("ready");
    expect(first.packageSize).toBe(130);
    expect(first.packageUnit).toBe("г");
    expect(first.barcode).toBe("4600605017333");
    expect(first.verified).toBe(false);
    expect(first.imageUrl).toBe(
      "https://images.openfoodfacts.org/images/products/460/060/501/7333/front_ru.34.400.jpg",
    );

    // Hit 2: kJ only — 555 kJ / 4.184 = 132.6 kcal (existing fallback).
    const second = result.products[1];
    expect(second.id).toBe("off-4600605017326");
    expect(second.calories).toBe(132.6);
    expect(second.protein).toBe(5.2);

    // Hit 3: the barcode cross-check product (matches live v3 data).
    const third = result.products[2];
    expect(third.id).toBe("off-4600605017265");
    expect(third.name).toBe("Даниссимо Творожный с сочным киви 130г");
    expect(third.calories).toBe(135);
    expect(third.protein).toBe(5.5);
    expect(third.fat).toBe(5.5);
    expect(third.carbs).toBe(15.8);
    expect(third.category).toBe("dairy");
    expect(third.packageSize).toBe(130);

    // Hit 4: "135 мл" quantity with a g base unit — no "упаковка" unit
    // option is added (mass↔volume never invented); the parsed package
    // display fields remain, product stays usable.
    const fourth = result.products[3];
    expect(fourth.id).toBe("off-4600605022610");
    expect(fourth.calories).toBe(125.7);
    expect(fourth.packageSize).toBe(135);
    expect(fourth.packageUnit).toBe("мл");
    expect(fourth.units.some((unit) => unit.key === "package")).toBe(false);

    // Hit 5: kJ 568 → 135.8, "140 г" package.
    const fifth = result.products[4];
    expect(fifth.id).toBe("off-4600605021316");
    expect(fifth.calories).toBe(135.8);
    expect(fifth.packageSize).toBe(140);
  });

  it("normalizes the REAL captured даниссимо page 4 (pagination + missing nutrition)", async () => {
    mockFetch(() => ({ status: 200, body: SEARCH_DANISSIMO_PAGE4 }));
    const result = await searchOffProducts("даниссимо", 4);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    // All five hits survive; three of them have no nutriments at all.
    expect(result.products).toHaveLength(5);

    const nutritionless = result.products[0];
    expect(nutritionless.id).toBe("off-4600605022436");
    expect(nutritionless.name).toBe("Даниссимо со вкусом Фисташковое мороженое");
    // Unknown nutrition stays undefined — never a fake zero.
    expect(nutritionless.calories).toBeUndefined();
    expect(nutritionless.protein).toBeUndefined();
    expect(nutritionless.fat).toBeUndefined();
    expect(nutritionless.carbs).toBeUndefined();

    // Compound quantity "105 г (93 г йогурт и 12 г наполнитель)": the
    // strict parser rejects it and the index has no product_quantity
    // fallback — no package unit, product still usable.
    const fantasia = result.products[1];
    expect(fantasia.id).toBe("off-4600605021781");
    expect(fantasia.calories).toBe(120.7); // 505 kJ / 4.184
    expect(fantasia.packageSize).toBeUndefined();

    // Minimal hit: no brands, no quantity, no categories, no image.
    const minimal = result.products[2];
    expect(minimal.id).toBe("off-4600605033982");
    expect(minimal.name).toBe("Даниссимо шарики микс");
    expect(minimal.brand).toBeUndefined();
    expect(minimal.imageUrl).toBeUndefined();
    expect(minimal.calories).toBeUndefined();
  });

  it("normalizes the REAL captured макфа page (casing, unit-less quantity, macros without energy)", async () => {
    mockFetch(() => ({ status: 200, body: SEARCH_MACFA }));
    const result = await searchOffProducts("макфа", 1);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.products).toHaveLength(6);

    const rakushki = result.products[0];
    expect(rakushki.id).toBe("off-4601780000837");
    expect(rakushki.brand).toBe("Макфа");
    expect(rakushki.calories).toBe(342);
    expect(rakushki.packageSize).toBeUndefined(); // no quantity at all

    // "2 kg" → package display fields 2 кг; the "упаковка" unit
    // option carries the converted 2000 g base.
    const flour = result.products[1];
    expect(flour.calories).toBe(334);
    expect(flour.packageSize).toBe(2);
    expect(flour.packageUnit).toBe("кг");
    expect(flour.units.find((unit) => unit.key === "package")?.base).toBe(
      2000,
    );

    // спагетти: macros present but NO energy field — the energy value
    // must not be invented, so nutrition stays unknown as a whole.
    const spaghetti = result.products[3];
    expect(spaghetti.id).toBe("off-4601780010508");
    expect(spaghetti.calories).toBeUndefined();
    expect(spaghetti.protein).toBeUndefined();
    // Unit-less quantity "400" is rejected by the strict parser.
    expect(spaghetti.packageSize).toBeUndefined();

    // Пшено макфа: no brands, no nutriments — still a usable product.
    const millet = result.products[4];
    expect(millet.id).toBe("off-4601780005443");
    expect(millet.brand).toBeUndefined();
    expect(millet.calories).toBeUndefined();

    // "450 г" package with latin-cased MAKFA brand.
    const pasta = result.products[5];
    expect(pasta.brand).toBe("MAKFA");
    expect(pasta.calories).toBe(350);
    expect(pasta.packageSize).toBe(450);
  });

  it("normalizes the REAL captured молоко page (kJ-only dairy)", async () => {
    mockFetch(() => ({ status: 200, body: SEARCH_MOLOKO }));
    const result = await searchOffProducts("молоко", 1);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.products).toHaveLength(5);

    // 190 kJ / 4.184 = 45.4 kcal; "970 ml" with a g base unit → the
    // parsed display fields remain, but no "упаковка" unit option
    // (mass↔volume never invented).
    const milk15 = result.products[0];
    expect(milk15.id).toBe("off-4640017350413");
    expect(milk15.name).toBe("Молоко 1,5 %");
    expect(milk15.calories).toBe(45.4);
    expect(milk15.packageSize).toBe(970);
    expect(milk15.packageUnit).toBe("мл");
    expect(milk15.units.some((unit) => unit.key === "package")).toBe(false);

    const milk32 = result.products[1];
    expect(milk32.calories).toBe(59.8); // 250 kJ

    // "1000 g" → a 1000 g package (compatible with the g base unit).
    const northern = result.products[2];
    expect(northern.calories).toBe(53.3); // 223 kJ
    expect(northern.packageSize).toBe(1000);

    // Cramped "1,9л" quantity parses to 1.9 л display fields; no
    // "упаковка" unit option (л vs g base unit), product stays usable.
    const favourite = result.products[4];
    expect(favourite.id).toBe("off-4870003213136");
    expect(favourite.calories).toBeUndefined();
    expect(favourite.packageSize).toBe(1.9);
    expect(favourite.packageUnit).toBe("л");
  });

  it("normalizes the REAL captured данон page (multi-brand arrays, float noise)", async () => {
    mockFetch(() => ({ status: 200, body: SEARCH_DANON }));
    const result = await searchOffProducts("данон", 1);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.products).toHaveLength(5);

    const bio = result.products[0];
    expect(bio.id).toBe("off-4600605032824");
    expect(bio.brand).toBe("Данон");
    expect(bio.calories).toBe(51);

    // ["Данон"] → "Данон"; index float noise passes through as-is.
    const yogurt = result.products[1];
    expect(yogurt.name).toBe("Йогурт");
    expect(yogurt.calories).toBe(69);
    expect(yogurt.protein ?? 0).toBeCloseTo(2.8, 5);

    // ["Danone", "Данон"] → joined "Danone,Данон" → first brand wins.
    const curd = result.products[2];
    expect(curd.brand).toBe("Danone");
    expect(curd.calories).toBe(111.1); // 465 kJ / 4.184
    expect(curd.packageSize).toBe(170); // "170 г"

    // No nutriments → unknown; "4 x 125 g" fails the strict parser.
    const activia = result.products[3];
    expect(activia.calories).toBeUndefined();
    const danette = result.products[4];
    expect(danette.calories).toBe(123);
    expect(danette.packageSize).toBeUndefined();
  });

  it("skips nameless and unusable records, keeps nutritionless ones, dedupes by barcode", async () => {
    mockFetch(() => ({ status: 200, body: SEARCH_EDGE_CASES }));
    const result = await searchOffProducts("бренд", 1);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    // 7 synthetic hits: nameless (skip) + duplicate (×2 → 1) +
    // unusable code (skip) leave 4 products.
    expect(result.products).toHaveLength(4);

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

    // Legacy STRING brands keep working through the adapter.
    const stringBrand = result.products[2];
    expect(stringBrand.id).toBe("off-4604444444444");
    expect(stringBrand.brand).toBe("Домик в деревне");

    // product_name_ru wins over product_name (existing bestName rule);
    // kJ 418.4 / 4.184 = exactly 100 kcal.
    const ruNamed = result.products[3];
    expect(ruNamed.id).toBe("off-4605555555555");
    expect(ruNamed.name).toBe("Русское название");
    expect(ruNamed.calories).toBe(100);
  });

  it("reports an honest empty result when OFF has no matches", async () => {
    mockFetch(() => ({ status: 200, body: { count: 0, hits: [] } }));
    const result = await searchOffProducts("ыввцук", 1);
    expect(result).toEqual({ status: "empty" });
  });

  it("treats a missing hits array with count 0 as empty", async () => {
    mockFetch(() => ({ status: 200, body: { count: 0 } }));
    const result = await searchOffProducts("ыввцук", 1);
    expect(result).toEqual({ status: "empty" });
  });

  it("maps HTTP errors to error (never empty)", async () => {
    mockFetch(() => ({ status: 503, raw: "Page temporarily unavailable" }));
    const result = await searchOffProducts("даниссимо", 1);
    expect(result.status).toBe("error");
  });

  it("maps FastAPI 422 validation errors (JSON detail) to error", async () => {
    mockFetch(() => ({
      status: 422,
      body: {
        detail: [
          {
            type: "greater_than_equal",
            loc: ["query", "page"],
            msg: "Input should be greater than or equal to 1",
            input: "0",
          },
        ],
      },
    }));
    const result = await searchOffProducts("молоко", 1);
    expect(result.status).toBe("error");
  });

  it("maps FastAPI 400 errors and 500 HTML errors to error", async () => {
    mockFetch(() => ({
      status: 400,
      body: { detail: "`sort_by` must be provided when `q` is missing" },
    }));
    expect((await searchOffProducts("молоко", 1)).status).toBe("error");

    // page_size=0 style upstream bug: 500 with a plain HTML body.
    mockFetch(() => ({
      status: 500,
      raw: "<html><body>Internal Server Error</body></html>",
    }));
    expect((await searchOffProducts("молоко", 1)).status).toBe("error");
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

  it("reports empty when hits exist but none survive normalization", async () => {
    mockFetch(() => ({
      status: 200,
      body: {
        count: 2,
        hits: [{ code: "123", brands: ["X"] }, { code: "", product_name: "Y" }],
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
