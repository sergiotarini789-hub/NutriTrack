import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { resetOffStateForTests } from "@/lib/server/openfoodfacts";
import {
  AGUSHA_V3,
  NOT_FOUND_V3,
  NO_NUTRITION_V3,
} from "@/lib/server/__tests__/fixtures";

const AGUSHA = "4602541000592";

function call(barcode: string) {
  return GET(new Request("http://localhost/api/foods/barcode/x"), {
    params: Promise.resolve({ barcode }),
  });
}

beforeEach(() => {
  resetOffStateForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPEN_FOOD_FACTS_USER_AGENT;
});

describe("GET /api/foods/barcode/[barcode]", () => {
  it("rejects an invalid barcode with 400 and never contacts Open Food Facts", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await call("abc123");
    expect(response.status).toBe(400);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("invalid");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects an empty barcode with 400", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await call("%20%20");
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("normalizes spaces and hyphens server-side before querying OFF", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return new Response(JSON.stringify(AGUSHA_V3), { status: 200 });
      }),
    );
    const response = await call("46%200254-1000%20592");
    expect(response.status).toBe(200);
    expect(calls[0]).toContain(`/api/v3/product/${AGUSHA}.json`);
    const body = (await response.json()) as {
      status: string;
      product: { id: string; barcode: string };
    };
    expect(body.status).toBe("found");
    expect(body.product.id).toBe(`off-${AGUSHA}`);
    expect(body.product.barcode).toBe(AGUSHA);
  });

  it("returns the normalized BrandedProduct for a found barcode", async () => {
    let seenUrl = "";
    let seenUa = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        seenUrl = String(input);
        seenUa = new Headers(init?.headers).get("User-Agent") ?? "";
        return new Response(JSON.stringify(AGUSHA_V3), { status: 200 });
      }),
    );
    const response = await call(AGUSHA);
    expect(response.status).toBe(200);
    expect(seenUrl).toContain("https://world.openfoodfacts.org/api/v3/product/");
    expect(seenUrl).toContain("lc=ru&cc=ru");
    expect(seenUa).toMatch(/^NutriTrack\//); // default identifying UA
    const body = (await response.json()) as {
      status: string;
      product: { type: string; sourceType: string; sourceId: string };
    };
    expect(body.status).toBe("found");
    expect(body.product.type).toBe("branded");
    expect(body.product.sourceType).toBe("open_food_facts");
    expect(body.product.sourceId).toBe(AGUSHA);
  });

  it("uses OPEN_FOOD_FACTS_USER_AGENT from the environment when present", async () => {
    process.env.OPEN_FOOD_FACTS_USER_AGENT = "EnvAgent/2.0 (route test)";
    let seenUa = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        seenUa = new Headers(init?.headers).get("User-Agent") ?? "";
        return new Response(JSON.stringify(NOT_FOUND_V3), { status: 404 });
      }),
    );
    await call(AGUSHA);
    expect(seenUa).toBe("EnvAgent/2.0 (route test)");
  });

  it("returns an explicit not_found without exposing raw OFF data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify(NOT_FOUND_V3), { status: 404 }),
      ),
    );
    const response = await call("4609999999999");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("not_found");
    expect(Object.keys(body)).toEqual(["status"]);
  });

  it("returns incomplete (product exists, no nutrition data)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify(NO_NUTRITION_V3), { status: 200 }),
      ),
    );
    const response = await call(AGUSHA);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      name?: string;
      brand?: string;
    };
    expect(body.status).toBe("incomplete");
    expect(body.brand).toBe("Агуша");
  });

  it("returns 502 with an error status when OFF fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 502 })),
    );
    const response = await call(AGUSHA);
    expect(response.status).toBe(502);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("error");
  });

  it("serves the second identical lookup from the server cache (one OFF request)", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return new Response(JSON.stringify(AGUSHA_V3), { status: 200 });
      }),
    );
    await call(AGUSHA);
    await call(AGUSHA);
    expect(calls).toHaveLength(1);
  });
});
