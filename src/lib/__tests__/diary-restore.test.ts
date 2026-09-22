import { describe, expect, it } from "vitest";
import { withRestoredEntry } from "../entry-restore";
import type { FoodEntry } from "../types";

function makeEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: "entry-test-1",
    foodId: "buckwheat",
    foodType: "generic",
    mealType: "lunch",
    amount: 200,
    unit: "g",
    date: "2026-09-21",
    createdAt: "2026-09-21T09:15:00.000Z",
    ...overrides,
  };
}

describe("withRestoredEntry (Stage 14B delete undo)", () => {
  it("restores the EXACT original entry object — same reference", () => {
    const deleted = makeEntry();
    const next = withRestoredEntry([], deleted);
    expect(next).toHaveLength(1);
    // The very same object: id, createdAt, date, meal, amount, unit,
    // foodType are preserved without re-stamping.
    expect(next[0]).toBe(deleted);
    expect(next[0].id).toBe("entry-test-1");
    expect(next[0].createdAt).toBe("2026-09-21T09:15:00.000Z");
    expect(next[0].date).toBe("2026-09-21");
    expect(next[0].mealType).toBe("lunch");
    expect(next[0].amount).toBe(200);
    expect(next[0].unit).toBe("g");
    expect(next[0].foodType).toBe("generic");
  });

  it("keeps the other entries and appends the restored one at the end", () => {
    const a = makeEntry({ id: "entry-a", foodId: "rice" });
    const b = makeEntry({ id: "entry-b", foodId: "milk-2.5" });
    const restored = makeEntry({ id: "entry-c", foodId: "egg" });
    const next = withRestoredEntry([a, b], restored);
    expect(next.map((e) => e.id)).toEqual(["entry-a", "entry-b", "entry-c"]);
  });

  it("is idempotent: restoring an already-present id is a no-op", () => {
    const a = makeEntry({ id: "entry-a" });
    const again = makeEntry({ id: "entry-a" });
    const next = withRestoredEntry([a], again);
    expect(next).toHaveLength(1);
    // The existing entry wins — the passed copy is not inserted.
    expect(next[0]).toBe(a);
  });

  it("returns the previous array reference unchanged when the id exists", () => {
    const a = makeEntry({ id: "entry-a" });
    const previous = [a];
    const next = withRestoredEntry(previous, makeEntry({ id: "entry-a" }));
    expect(next).toBe(previous);
  });

  it("double restore does not duplicate the entry", () => {
    const deleted = makeEntry({ id: "entry-x" });
    const once = withRestoredEntry([], deleted);
    const twice = withRestoredEntry(once, deleted);
    expect(twice).toBe(once);
    expect(twice).toHaveLength(1);
  });
});
