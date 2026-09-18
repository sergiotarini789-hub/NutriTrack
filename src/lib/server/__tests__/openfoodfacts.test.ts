import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOffUrl,
  fetchOffProductByBarcode,
  lookupOffBarcode,
  mapOffCategory,
  normalizeOffProduct,
  parseOffNutrition,
  parseOffPackageSize,
  resetOffStateForTests,
} from "../openfoodfacts";
import {
  AGUSHA_V3,
  DOMIK_V3,
  NO_BRAND_NO_NAME_V3,
  NO_CARBS_V3,
  NO_FAT_V3,
  NO_IMAGE_V3,
  NO_NUTRITION_V3,
  NO_PROTEIN_V3,
  NO_QUANTITY_V3,
  NOT_FOUND_V3,
  PROSTOKVASHINO_V3,
  SMALL_SERVING_V3,
  WRONG_CODE_V3,
} from "./fixtures";

const AGUSHA = "4602541000592";
const PROSTOKVASHINO = "4607053473544";
const DOMIK = "4690228007842";

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
      return new Response(JSON.stringify(NOT_FOUND_V3), { status: 404 });
    }
    if (result.raw !== undefined) {
      return new Response(result.raw, { status: result.status });
    }
    return new Response(JSON.stringify(result.body ?? {}), {
      status: result.status,
    });
  });
  vi.stubGlobal("fetch", spy);
  return { calls };
}

let fetchCalls: string[] = [];

beforeEach(() => {
  resetOffStateForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ */
/* Nutrition parsing                                                   */
/* ------------------------------------------------------------------ */

describe("parseOffNutrition", () => {
  it("parses complete nutrition (real Агуша payload)", () => {
    const result = parseOffNutrition(
      AGUSHA_V3.product.nutriments,
      AGUSHA_V3.product.nutrition_data_per,
    );
    expect(result).toEqual({
      calories: 89,
      protein: 8.5,
      fat: 4.5,
      carbs: 3.5,
      baseUnit: "g",
    });
  });

  it("derives kcal from kJ when kcal is missing (real Простоквашино payload)", () => {
    const result = parseOffNutrition(
      PROSTOKVASHINO_V3.product.nutriments,
      PROSTOKVASHINO_V3.product.nutrition_data_per,
    );
    expect(result).not.toBeNull();
    expect(result?.calories).toBe(53.8); // 225 / 4.184
    expect(result?.baseUnit).toBe("ml");
  });

  it("keeps a missing protein undefined — not zero", () => {
    const result = parseOffNutrition(
      NO_PROTEIN_V3.product.nutriments,
      "100g",
    );
    expect(result?.protein).toBeUndefined();
    expect(result?.fat).toBe(4.5);
  });

  it("keeps a missing fat undefined — not zero", () => {
    const result = parseOffNutrition(NO_FAT_V3.product.nutriments, "100g");
    expect(result?.fat).toBeUndefined();
    expect(result?.carbs).toBe(3.5);
  });

  it("keeps a missing carbs undefined — not zero", () => {
    const result = parseOffNutrition(NO_CARBS_V3.product.nutriments, "100g");
    expect(result?.carbs).toBeUndefined();
    expect(result?.protein).toBe(8.5);
  });

  it("preserves genuine zeros (0 means zero, not missing)", () => {
    const result = parseOffNutrition(
      { "energy-kcal_100g": 42, proteins_100g: 0, fat_100g: 0, carbohydrates_100g: 10.6 },
      "100g",
    );
    expect(result?.protein).toBe(0);
    expect(result?.fat).toBe(0);
    expect(result?.carbs).toBe(10.6);
  });

  it("returns null when neither kcal nor kJ exists", () => {
    expect(parseOffNutrition({ proteins_100g: 3 }, "100g")).toBeNull();
    expect(parseOffNutrition(null, "100g")).toBeNull();
    expect(parseOffNutrition(undefined, "100g")).toBeNull();
  });

  it("uses ml only when explicitly per 100 ml", () => {
    expect(parseOffNutrition({ "energy-kcal_100g": 10 }, "100ml")?.baseUnit).toBe("ml");
    expect(parseOffNutrition({ "energy-kcal_100g": 10 }, "100g")?.baseUnit).toBe("g");
    // Unknown basis defaults to g — never inferred from the package size.
    expect(parseOffNutrition({ "energy-kcal_100g": 10 }, undefined)?.baseUnit).toBe("g");
  });
});

/* ------------------------------------------------------------------ */
/* Category mapping                                                    */
/* ------------------------------------------------------------------ */

describe("mapOffCategory", () => {
  it("maps dairy by majority vote even when OFF also tags the milk as a beverage", () => {
    expect(mapOffCategory(DOMIK_V3.product.categories_tags)).toBe("dairy");
  });

  it("maps fruit juices to drinks, not fruits", () => {
    expect(
      mapOffCategory(["en:fruits", "en:fruit-juices", "en:beverages"]),
    ).toBe("drinks");
  });

  it("falls back to a safe category for unknown or absent tags", () => {
    expect(mapOffCategory([])).toBe("ready");
    expect(mapOffCategory(undefined)).toBe("ready");
    expect(mapOffCategory(["en:some-unknown-tag"])).toBe("ready");
  });

  it("maps chips to ready (matches the local database convention)", () => {
    expect(mapOffCategory(["en:snacks", "en:salty-snacks", "en:chipses"])).toBe("ready");
  });
});

/* ------------------------------------------------------------------ */
/* Package size                                                        */
/* ------------------------------------------------------------------ */

describe("parseOffPackageSize", () => {
  it("parses common quantity structures", () => {
    expect(parseOffPackageSize("930 ml", undefined, undefined)).toEqual({ size: 930, unit: "мл" });
    expect(parseOffPackageSize("925мл", undefined, undefined)).toEqual({ size: 925, unit: "мл" });
    expect(parseOffPackageSize("50 g", undefined, undefined)).toEqual({ size: 50, unit: "г" });
    expect(parseOffPackageSize("100.0g", undefined, undefined)).toEqual({ size: 100, unit: "г" });
    expect(parseOffPackageSize("2 л", undefined, undefined)).toEqual({ size: 2, unit: "л" });
    expect(parseOffPackageSize("800 г", undefined, undefined)).toEqual({ size: 800, unit: "г" });
  });

  it("falls back to structured product_quantity fields", () => {
    expect(parseOffPackageSize(undefined, 285, "g")).toEqual({ size: 285, unit: "г" });
    expect(parseOffPackageSize(undefined, 0.45, "kg")).toEqual({ size: 0.45, unit: "кг" });
  });

  it("yields undefined for unclear structures", () => {
    expect(parseOffPackageSize("450", undefined, undefined)).toBeUndefined();
    expect(parseOffPackageSize("примерно 2 пачки", undefined, undefined)).toBeUndefined();
    expect(parseOffPackageSize(undefined, undefined, undefined)).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* Product normalization                                               */
/* ------------------------------------------------------------------ */

describe("normalizeOffProduct", () => {
  it("converts a complete real response into a BrandedProduct", () => {
    const result = normalizeOffProduct(AGUSHA_V3, AGUSHA);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const product = result.product;
    expect(product.type).toBe("branded");
    expect(product.sourceType).toBe("open_food_facts");
    expect(product.sourceId).toBe(AGUSHA);
    expect(product.id).toBe(`off-${AGUSHA}`);
    expect(product.barcode).toBe(AGUSHA);
    expect(product.name).toBe("Творог детский «Агуша» классический 4,5 %");
    expect(product.brand).toBe("Агуша");
    expect(product.category).toBe("dairy");
    expect(product.calories).toBe(89);
    expect(product.protein).toBe(8.5);
    expect(product.fat).toBe(4.5);
    expect(product.carbs).toBe(3.5);
    expect(product.baseUnit).toBe("g");
    expect(product.packageSize).toBe(50);
    expect(product.packageUnit).toBe("г");
    expect(product.imageUrl).toContain("images.openfoodfacts.org");
    expect(product.ingredients).toBe("молоко нормализованное, закваска");
    expect(product.verified).toBe(false);
    // Package unit equivalent to 50 g exists.
    const packageUnit = product.units.find((unit) => unit.key === "package");
    expect(packageUnit?.base).toBe(50);
  });

  it("flattens missing macros to 0 in the model while the parser keeps them undefined", () => {
    const parsed = parseOffNutrition(NO_PROTEIN_V3.product.nutriments, "100g");
    expect(parsed?.protein).toBeUndefined();
    const result = normalizeOffProduct(NO_PROTEIN_V3, AGUSHA);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.protein).toBe(0);
  });

  it("normalizes the kJ-only milk: 53,8 kcal per 100 ml, ml base unit", () => {
    const result = normalizeOffProduct(PROSTOKVASHINO_V3, PROSTOKVASHINO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.product.calories).toBe(53.8);
    expect(result.product.baseUnit).toBe("ml");
    expect(result.product.units[0].key).toBe("ml");
    const packageUnit = result.product.units.find((unit) => unit.key === "package");
    expect(packageUnit?.base).toBe(930);
    // serving = the whole package (930 ml) must NOT become a serving option.
    expect(
      result.product.servingOptions.some((s) => s.amount === 930),
    ).toBe(false);
  });

  it("adds a serving option when the serving is smaller than the package", () => {
    const result = normalizeOffProduct(SMALL_SERVING_V3, AGUSHA);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.product.servingOptions.some(
        (s) => s.unitKey === "g" && s.amount === 30,
      ),
    ).toBe(true);
  });

  it("works without an image (imageUrl undefined)", () => {
    const result = normalizeOffProduct(NO_IMAGE_V3, AGUSHA);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.imageUrl).toBeUndefined();
  });

  it("works without any package quantity (packageSize undefined)", () => {
    const result = normalizeOffProduct(NO_QUANTITY_V3, AGUSHA);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.product.packageSize).toBeUndefined();
    expect(result.product.packageUnit).toBeUndefined();
    expect(
      result.product.units.some((unit) => unit.key === "package"),
    ).toBe(false);
  });

  it("leaves the brand undefined when OFF provides none — never invents one", () => {
    const result = normalizeOffProduct(NO_BRAND_NO_NAME_V3, AGUSHA);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.product.brand).toBeUndefined();
      expect(result.product.name).toBe("Продукт без названия");
    }
  });

  it("reports no_nutrition when the product has no energy data", () => {
    const result = normalizeOffProduct(NO_NUTRITION_V3, AGUSHA);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no_nutrition");
      expect(result.partial?.name).toBe("Творог детский «Агуша» классический 4,5 %");
    }
  });

  it("rejects a response whose code does not match the requested barcode", () => {
    const result = normalizeOffProduct(WRONG_CODE_V3, "4609999999999");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("code_mismatch");
  });

  it("accepts codes that differ only by leading zeros", () => {
    const shifted = JSON.parse(JSON.stringify(AGUSHA_V3));
    shifted.code = "0" + AGUSHA;
    shifted.product.code = "0" + AGUSHA;
    const result = normalizeOffProduct(shifted, AGUSHA);
    expect(result.ok).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Fetch classification (mocked OFF API)                               */
/* ------------------------------------------------------------------ */

describe("fetchOffProductByBarcode", () => {
  it("classifies a found product", async () => {
    const mock = mockFetch(() => ({ status: 200, body: AGUSHA_V3 }));
    const result = await fetchOffProductByBarcode(AGUSHA);
    expect(result.status).toBe("found");
    // Exactly one request, against the official v3 endpoint, with ru locale.
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0]).toContain("world.openfoodfacts.org/api/v3/product/");
    expect(mock.calls[0]).toContain("lc=ru");
    expect(mock.calls[0]).toContain("cc=ru");
    vi.unstubAllGlobals();
  });

  it("classifies the official not-found response (real payload)", async () => {
    mockFetch(() => ({ status: 404, body: NOT_FOUND_V3 }));
    const result = await fetchOffProductByBarcode("4609999999999");
    expect(result.status).toBe("not_found");
    vi.unstubAllGlobals();
  });

  it("treats HTTP errors as errors, not as not-found", async () => {
    mockFetch(() => ({ status: 500, body: { status: "success" } }));
    const result = await fetchOffProductByBarcode(AGUSHA);
    expect(result.status).toBe("error");
    vi.unstubAllGlobals();
  });

  it("treats malformed JSON as an error", async () => {
    mockFetch(() => ({ status: 200, raw: "<html>not json</html>" }));
    const result = await fetchOffProductByBarcode(AGUSHA);
    expect(result.status).toBe("error");
    vi.unstubAllGlobals();
  });

  it("treats a network failure as an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("fetch failed");
      }),
    );
    const result = await fetchOffProductByBarcode(AGUSHA);
    expect(result.status).toBe("error");
    vi.unstubAllGlobals();
  });

  it("reports products without nutrition data as incomplete", async () => {
    mockFetch(() => ({ status: 200, body: NO_NUTRITION_V3 }));
    const result = await fetchOffProductByBarcode(AGUSHA);
    expect(result.status).toBe("incomplete");
    if (result.status === "incomplete") {
      expect(result.brand).toBe("Агуша");
    }
    vi.unstubAllGlobals();
  });

  it("respects OPEN_FOOD_FACTS_USER_AGENT when set", async () => {
    process.env.OPEN_FOOD_FACTS_USER_AGENT = "TestAgent/9.9 (unit tests)";
    let seenUa = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        seenUa = new Headers(init?.headers).get("User-Agent") ?? "";
        return new Response(JSON.stringify(NOT_FOUND_V3), { status: 404 });
      }),
    );
    await fetchOffProductByBarcode("4609999999999");
    expect(seenUa).toBe("TestAgent/9.9 (unit tests)");
    delete process.env.OPEN_FOOD_FACTS_USER_AGENT;
    vi.unstubAllGlobals();
  });
});

/* ------------------------------------------------------------------ */
/* Cache                                                               */
/* ------------------------------------------------------------------ */

describe("lookupOffBarcode caching", () => {
  it("fetches once for a repeated barcode (cache hit)", async () => {
    const mock = mockFetch((url) =>
      url.includes(AGUSHA)
        ? { status: 200, body: AGUSHA_V3 }
        : { status: 404, body: NOT_FOUND_V3 },
    );
    fetchCalls = mock.calls;
    const first = await lookupOffBarcode(AGUSHA);
    const second = await lookupOffBarcode(AGUSHA);
    expect(first.status).toBe("found");
    expect(second.status).toBe("found");
    expect(fetchCalls.filter((url) => url.includes(AGUSHA))).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it("caches different barcodes separately", async () => {
    const mock = mockFetch((url) => {
      if (url.includes(AGUSHA)) return { status: 200, body: AGUSHA_V3 };
      if (url.includes(DOMIK)) return { status: 200, body: DOMIK_V3 };
      return null;
    });
    fetchCalls = mock.calls;
    const agusha = await lookupOffBarcode(AGUSHA);
    const domik = await lookupOffBarcode(DOMIK);
    const agushaAgain = await lookupOffBarcode(AGUSHA);
    expect(agusha.status).toBe("found");
    expect(domik.status).toBe("found");
    expect(agushaAgain.status).toBe("found");
    if (
      agusha.status === "found" &&
      domik.status === "found" &&
      agushaAgain.status === "found"
    ) {
      expect(agushaAgain.product.name).not.toBe(domik.product.name);
      expect(agushaAgain.product.id).toBe(`off-${AGUSHA}`);
      expect(domik.product.id).toBe(`off-${DOMIK}`);
    }
    expect(fetchCalls).toHaveLength(2);
    vi.unstubAllGlobals();
  });

  it("caches negative results but never caches errors", async () => {
    let failures = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("4609999999999")) {
          return new Response(JSON.stringify(NOT_FOUND_V3), { status: 404 });
        }
        failures += 1;
        return new Response("gateway timeout", { status: 504 });
      }),
    );
    const missing1 = await lookupOffBarcode("4609999999999");
    const missing2 = await lookupOffBarcode("4609999999999");
    expect(missing1.status).toBe("not_found");
    expect(missing2.status).toBe("not_found");
    const error1 = await lookupOffBarcode(AGUSHA);
    const error2 = await lookupOffBarcode(AGUSHA);
    expect(error1.status).toBe("error");
    expect(error2.status).toBe("error");
    expect(failures).toBe(2); // retried because errors stay uncached
    vi.unstubAllGlobals();
  });
});

describe("buildOffUrl", () => {
  it("targets the official v3 product endpoint by default", () => {
    const url = buildOffUrl("4601234567891");
    expect(url).toBe(
      "https://world.openfoodfacts.org/api/v3/product/4601234567891.json" +
        "?fields=code,product_name,product_name_ru,generic_name,brands,quantity,product_quantity,product_quantity_unit,serving_size,serving_quantity,nutrition_data_per,nutriments,image_front_url,ingredients_text,categories_tags&lc=ru&cc=ru",
    );
  });

  it("honors the base URL override (used by tests/ops)", () => {
    process.env.OPEN_FOOD_FACTS_API_BASE = "http://127.0.0.1:3001";
    expect(buildOffUrl("123")).toContain("http://127.0.0.1:3001/api/v3/product/");
    delete process.env.OPEN_FOOD_FACTS_API_BASE;
  });
});
