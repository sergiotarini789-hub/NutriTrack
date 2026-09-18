/**
 * Stage 8B tests — client OpenFoodFactsRepository.
 *
 * fetch is MOCKED. Covers the new search() mapping (ok/empty/error,
 * malformed JSON, short query never hits the network) and the Stage 7
 * barcode lookup regression (must remain compatible).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenFoodFactsRepository } from "../openfoodfacts-repository";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("OpenFoodFactsRepository.search", () => {
  it("returns normalized products on ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "ok",
          products: [
            {
              id: "off-4600605017265",
              type: "branded",
              name: "Даниссимо Творожный с сочным киви 130г",
              brand: "Даниссимо",
              calories: 135,
            },
          ],
        }),
      ),
    );
    const result = await new OpenFoodFactsRepository().search("даниссимо");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.products[0].id).toBe("off-4600605017265");
    expect(result.products[0].brand).toBe("Даниссимо");
  });

  it("maps an honest empty result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "empty" })),
    );
    const result = await new OpenFoodFactsRepository().search("ыввцук");
    expect(result).toEqual({ status: "empty" });
  });

  it("maps an ok response with zero products to empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "ok", products: [] })),
    );
    expect(await new OpenFoodFactsRepository().search("x")).toEqual({
      status: "empty",
    });
  });

  it("maps HTTP errors to error — never empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 502 })),
    );
    const result = await new OpenFoodFactsRepository().search("молоко");
    expect(result).toEqual({ status: "error" });
  });

  it("maps malformed JSON to error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not json", { status: 200 })),
    );
    expect(await new OpenFoodFactsRepository().search("молоко")).toEqual({
      status: "error",
    });
  });

  it("maps network failure (offline) to error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Failed to fetch");
      }),
    );
    expect(await new OpenFoodFactsRepository().search("молоко")).toEqual({
      status: "error",
    });
  });

  it("never sends a request for queries shorter than 2 chars", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await new OpenFoodFactsRepository().search("м")).toEqual({
      status: "empty",
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("sends the trimmed query to the server route", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        urls.push(String(input));
        return jsonResponse({ status: "empty" });
      }),
    );
    await new OpenFoodFactsRepository().search("  Даниссимо ");
    expect(urls[0]).toBe(
      "/api/foods/search?q=%D0%94%D0%B0%D0%BD%D0%B8%D1%81%D1%81%D0%B8%D0%BC%D0%BE",
    );
  });
});

describe("OpenFoodFactsRepository.getByBarcode (Stage 7 regression)", () => {
  it("still resolves found products through the barcode route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        expect(String(input)).toBe("/api/foods/barcode/4600605017265");
        return jsonResponse({
          status: "found",
          product: {
            id: "off-4600605017265",
            type: "branded",
            name: "Даниссимо",
            calories: 135,
          },
        });
      }),
    );
    const result = await new OpenFoodFactsRepository().getByBarcode(
      "4600605017265",
    );
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.product.id).toBe("off-4600605017265");
      expect(result.origin).toBe("external");
    }
  });

  it("still reports invalid barcodes without a request", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await new OpenFoodFactsRepository().getByBarcode("abc")).toEqual({
      status: "invalid",
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
