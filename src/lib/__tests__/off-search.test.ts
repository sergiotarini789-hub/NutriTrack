/**
 * Stage 8B tests — debounced remote search controller.
 *
 * The search function is a MOCK (clearly labeled); timers are fake.
 * Covers: debounce, minimum query length, cancellation on cleared
 * input, stale-response protection, timeout/offline error states and
 * the empty/ok mappings.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OffSearchController,
  REMOTE_SEARCH_MIN_LENGTH,
  type RemoteSearchState,
} from "../off-search";
import type { RemoteSearchFn } from "../off-search";

const DEBOUNCE = 400;

function createHarness(
  searchImpl?: RemoteSearchFn,
): {
  states: RemoteSearchState[];
  controller: OffSearchController;
  search: ReturnType<typeof vi.fn>;
} {
  const states: RemoteSearchState[] = [];
  const search = vi.fn(
    searchImpl ??
      (async () => ({ status: "empty" as const })),
  );
  const controller = new OffSearchController({
    onStateChange: (state) => states.push(state),
    search,
    debounceMs: DEBOUNCE,
  });
  return { states, controller, search };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("debounce", () => {
  it("sends no request while the user is still typing", async () => {
    const h = createHarness();
    h.controller.setInput("м");
    h.controller.setInput("мо");
    h.controller.setInput("мол");
    await vi.advanceTimersByTimeAsync(DEBOUNCE - 1);
    expect(h.search).not.toHaveBeenCalled();
  });

  it("fires exactly one request after the input settles", async () => {
    const h = createHarness();
    h.controller.setInput("м");
    h.controller.setInput("мо");
    h.controller.setInput("мол");
    h.controller.setInput("молоко");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    expect(h.search).toHaveBeenCalledTimes(1);
    expect(h.search.mock.calls[0][0]).toBe("молоко");
  });

  it("requires at least 2 meaningful characters", async () => {
    const h = createHarness();
    h.controller.setInput("м");
    await vi.advanceTimersByTimeAsync(DEBOUNCE * 2);
    expect(h.search).not.toHaveBeenCalled();
    expect(REMOTE_SEARCH_MIN_LENGTH).toBe(2);
  });

  it("treats a whitespace-only query as empty — no request", async () => {
    const h = createHarness();
    h.controller.setInput("   ");
    await vi.advanceTimersByTimeAsync(DEBOUNCE * 2);
    expect(h.search).not.toHaveBeenCalled();
    expect(h.states.at(-1)).toEqual({ kind: "idle" });
  });

  it("cancel() drops a pending debounced request", async () => {
    const h = createHarness();
    h.controller.setInput("молоко");
    h.controller.cancel();
    await vi.advanceTimersByTimeAsync(DEBOUNCE * 2);
    expect(h.search).not.toHaveBeenCalled();
    expect(h.states.at(-1)).toEqual({ kind: "idle" });
  });

  it("clearing the input cancels the pending request (no empty API call)", async () => {
    const h = createHarness();
    h.controller.setInput("молоко");
    h.controller.setInput("");
    await vi.advanceTimersByTimeAsync(DEBOUNCE * 2);
    expect(h.search).not.toHaveBeenCalled();
    expect(h.states.at(-1)).toEqual({ kind: "idle" });
  });
});

describe("stale-response protection", () => {
  it("ignores a slow response to an outdated query", async () => {
    let resolveFirst: (value: { status: "ok"; products: never[] }) => void = () => {};
    const h = createHarness(async (query) => {
      if (query === "мол") {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return { status: "ok", products: [] };
    });

    h.controller.setInput("мол");
    await vi.advanceTimersByTimeAsync(DEBOUNCE); // "мол" request fires
    h.controller.setInput("молоко");
    await vi.advanceTimersByTimeAsync(DEBOUNCE); // "молоко" request fires

    // The stale "мол" response arrives last — it must be ignored.
    resolveFirst({ status: "ok", products: [] });
    await vi.advanceTimersByTimeAsync(0);

    const loadingQueries = h.states
      .filter((s) => s.kind === "loading")
      .map((s) => (s as { query: string }).query)
      // The controller emits loading eagerly AND when the request fires;
      // consecutive duplicates are expected.
      .filter((query, index, all) => index === 0 || query !== all[index - 1]);
    expect(loadingQueries).toEqual(["мол", "молоко"]);
    // Final state belongs to the LATEST query only.
    const finals = h.states.filter(
      (s) => s.kind === "ok" || s.kind === "empty" || s.kind === "error",
    );
    expect(finals).toHaveLength(1);
    expect((finals[0] as { query: string }).query).toBe("молоко");
  });

  it("aborts the in-flight request when a new input arrives", async () => {
    const signals: AbortSignal[] = [];
    const h = createHarness(async (query, signal) => {
      signals.push(signal);
      if (query === "мол") {
        return new Promise((_, reject) => {
          signal.addEventListener("abort", () =>
            reject(new Error("aborted as expected")),
          );
        });
      }
      return { status: "empty" };
    });
    h.controller.setInput("мол");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    h.controller.setInput("молоко");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    expect(signals[0].aborted).toBe(true);
    expect(h.states.at(-1)).toEqual({ kind: "empty", query: "молоко" });
  });
});

describe("result mapping", () => {
  it("maps a successful search to ok with products", async () => {
    const product = { id: "off-1" } as never;
    const h = createHarness(async () => ({
      status: "ok" as const,
      products: [product],
    }));
    h.controller.setInput("кефир");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    expect(h.states.at(-1)).toEqual({
      kind: "ok",
      query: "кефир",
      products: [product],
    });
  });

  it("maps an ok response with zero products to empty", async () => {
    const h = createHarness(async () => ({ status: "ok" as const, products: [] }));
    h.controller.setInput("кефир");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    expect(h.states.at(-1)).toEqual({ kind: "empty", query: "кефир" });
  });

  it("maps upstream empty to empty", async () => {
    const h = createHarness(async () => ({ status: "empty" as const }));
    h.controller.setInput("кефир");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    expect(h.states.at(-1)).toEqual({ kind: "empty", query: "кефир" });
  });

  it("maps a timeout to a user-safe error state", async () => {
    const h = createHarness(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 12_000),
        ),
    );
    h.controller.setInput("кефир");
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 12_000);
    expect(h.states.at(-1)).toEqual({ kind: "error", query: "кефир" });
  });

  it("maps being offline (rejection) to a user-safe error state", async () => {
    const h = createHarness(async () => {
      throw new Error("Failed to fetch");
    });
    h.controller.setInput("кефир");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    expect(h.states.at(-1)).toEqual({ kind: "error", query: "кефир" });
  });
});
