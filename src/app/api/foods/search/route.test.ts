import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { resetOffStateForTests } from "@/lib/server/openfoodfacts";
import { SEARCH_DANISSIMO } from "@/lib/server/__tests__/fixtures";

function call(url: string) {
  return GET(new Request(`http://localhost${url}`));
}

beforeEach(() => {
  resetOffStateForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/foods/search", () => {
  it("rejects queries shorter than 2 chars without contacting OFF", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const q of ["", "%20", "д", "x"]) {
      const response = await call(`/api/foods/search?q=${q}`);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ status: "invalid" });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects oversized queries", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await call(`/api/foods/search?q=${"а".repeat(101)}`);
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a missing query", async () => {
    const response = await call("/api/foods/search");
    expect(response.status).toBe(400);
  });

  it("rejects invalid pages (0, negative, non-numeric, >20)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const page of ["0", "-1", "abc", "21", "1.5"]) {
      const response = await call(`/api/foods/search?q=молоко&page=${page}`);
      expect(response.status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns normalized products for a successful search", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(SEARCH_DANISSIMO), { status: 200 }),
      ),
    );
    const response = await call("/api/foods/search?q=даниссимо");
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      products: Array<{ id: string; type: string }>;
    };
    expect(body.status).toBe("ok");
    expect(body.products).toHaveLength(2);
    expect(body.products[0].id).toBe("off-4600605019351");
    expect(body.products[0].type).toBe("branded");
  });

  it("trims and collapses whitespace in the query", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return new Response(JSON.stringify(SEARCH_DANISSIMO), { status: 200 });
      }),
    );
    await call("/api/foods/search?q=%20%20Даниссимо%20%20");
    expect(calls[0]).toContain(
      "search_terms=%D0%94%D0%B0%D0%BD%D0%B8%D1%81%D1%81%D0%B8%D0%BC%D0%BE",
    );
  });

  it("returns an honest empty status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ count: 0, products: [] }), { status: 200 }),
      ),
    );
    const response = await call("/api/foods/search?q=ыввцук");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "empty" });
  });

  it("maps upstream failures to 502 error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    );
    const response = await call("/api/foods/search?q=молоко");
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ status: "error" });
  });

  it("serves the second call from the server cache (single OFF request)", async () => {
    const spy = vi.fn(async () =>
      new Response(JSON.stringify(SEARCH_DANISSIMO), { status: 200 }),
    );
    vi.stubGlobal("fetch", spy);
    await call("/api/foods/search?q=кефир");
    await call("/api/foods/search?q=кефир");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
