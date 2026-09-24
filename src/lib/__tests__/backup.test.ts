import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BACKUP_VERSION,
  applyBackup,
  backupFileName,
  buildBackup,
  importBackupText,
  parseBackup,
  parseBackupText,
} from "../backup";
import type { FoodEntry } from "../types";

/**
 * Stage 15A backup tests. apply/import paths run against a stubbed
 * window.localStorage (a Map) — exactly the write surface the app uses.
 */

const KEYS = {
  entries: "nutritrack:v1:entries",
  profile: "nutritrack:v1:profile",
  targets: "nutritrack:v1:targets",
  targetMode: "nutritrack:v1:target-mode",
  userFoods: "nutritrack:v1:user-foods",
  offProducts: "nutritrack:v1:off-products",
};

function stubStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const ENTRY: FoodEntry = {
  id: "entry-x",
  foodId: "buckwheat",
  foodType: "generic",
  mealType: "lunch",
  amount: 123.45,
  unit: "piece",
  date: "2026-09-20",
  createdAt: "2026-09-20T08:00:00.000Z",
};

const PROFILE = {
  name: "Мария",
  gender: "female",
  age: 30,
  height: 165,
  weight: 58,
  activity: "medium",
  goal: "lose",
} as const;

const TARGETS = { calories: 1800, protein: 120, fat: 55, carbs: 190 };
const USER_FOOD = { id: "u1", name: "Мой творог" };

/** Seeds a complete persisted state into the stubbed storage. */
function seedFullState(store: Map<string, string>) {
  store.set(KEYS.entries, JSON.stringify([ENTRY]));
  store.set(KEYS.profile, JSON.stringify(PROFILE));
  store.set(KEYS.targets, JSON.stringify(TARGETS));
  store.set(KEYS.targetMode, JSON.stringify("manual"));
  store.set(KEYS.userFoods, JSON.stringify([USER_FOOD]));
  store.set(KEYS.offProducts, JSON.stringify([]));
}

/** The storage parser normalizes a minimal seed into a full product. */
function expectMyTvorog(value: unknown) {
  const product = (Array.isArray(value) ? value[0] : value) as Record<string, unknown>;
  expect(product.id).toBe("u1");
  expect(product.name).toBe("Мой творог");
  expect(product.type).toBe("user");
  expect(product.baseUnit).toBe("g");
}

function backupDoc(dataOverrides: Record<string, unknown> = {}) {
  return {
    app: "nutritrack",
    version: BACKUP_VERSION,
    exportedAt: "2026-09-24T00:00:00.000Z",
    data: {
      entries: [ENTRY],
      profile: PROFILE,
      targets: TARGETS,
      targetMode: "manual",
      userFoods: [USER_FOOD],
      offProducts: [],
      ...dataOverrides,
    },
  };
}

describe("buildBackup (export)", () => {
  it("exports a versioned document with all persisted sections", () => {
    const store = stubStorage();
    seedFullState(store);

    const backup = buildBackup();
    expect(backup.app).toBe("nutritrack");
    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBeTruthy();
    expect(backup.data.entries).toEqual([ENTRY]);
    expect(backup.data.profile).toEqual(PROFILE);
    expect(backup.data.targets).toEqual(TARGETS);
    expect(backup.data.targetMode).toBe("manual");
    expectMyTvorog(backup.data.userFoods);
    // Export must not mutate anything.
    expect(store.get(KEYS.entries)).toEqual(JSON.stringify([ENTRY]));
  });

  it("file name is nutritrack-backup-YYYY-MM-DD.json", () => {
    expect(backupFileName()).toMatch(/^nutritrack-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe("parseBackup / parseBackupText (validation)", () => {
  it("accepts a valid full backup", () => {
    const result = parseBackup(backupDoc());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.entries).toEqual([ENTRY]);
      expect(result.backup.profile).toEqual(PROFILE);
      expect(result.backup.targets).toEqual(TARGETS);
      expect(result.backup.targetMode).toBe("manual");
      expectMyTvorog(result.backup.userFoods);
      expect(result.backup.offProducts).toEqual([]);
    }
  });

  it("rejects corrupted JSON text", () => {
    const result = parseBackupText("{не json]]");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("повреждённый JSON");
  });

  it("rejects a non-NutriTrack document", () => {
    const result = parseBackup({ app: "other", version: 1, data: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("не является резервной копией");
  });

  it("rejects an unsupported version", () => {
    const result = parseBackup({ ...backupDoc(), version: 99 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Неподдерживаемая версия");
  });

  it("rejects invalid diary entries (one bad item rejects the whole import)", () => {
    const bad = [
      ENTRY,
      { id: "bad", foodId: 42, mealType: "lunch", amount: 10, unit: "g", date: "2026-09-20" },
    ];
    const result = parseBackup(backupDoc({ entries: bad }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("«entries»");
  });

  it("rejects invalid user products", () => {
    const result = parseBackup(backupDoc({ userFoods: [{ id: "u2" }] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("«user-foods»");
  });

  it("rejects an invalid profile", () => {
    const result = parseBackup(backupDoc({ profile: 42 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("«profile»");
  });

  it("rejects invalid targets", () => {
    const result = parseBackup(backupDoc({ targets: { calories: "много" } }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("«targets»");
  });

  it("rejects an invalid target mode", () => {
    const result = parseBackup(backupDoc({ targetMode: "sometimes" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("«target-mode»");
  });

  it("rejects an empty data section", () => {
    const result = parseBackup({ app: "nutritrack", version: 1, data: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("не содержит данных");
  });

  it("supports partial backups (absent sections are simply absent)", () => {
    const result = parseBackup({
      app: "nutritrack",
      version: 1,
      data: { entries: [ENTRY] },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.entries).toEqual([ENTRY]);
      expect(result.backup.profile).toBeUndefined();
      expect(result.backup.targetMode).toBeUndefined();
    }
  });
});

describe("importBackupText / applyBackup (validate first, apply second)", () => {
  it("round-trips a full backup into a different storage", () => {
    const source = stubStorage();
    seedFullState(source);
    const text = JSON.stringify(buildBackup());

    const target = stubStorage();
    // Target holds some previous (different) user data.
    target.set(KEYS.entries, JSON.stringify([{ id: "old" }]));
    const result = importBackupText(text);
    expect(result.ok).toBe(true);

    expect(JSON.parse(target.get(KEYS.entries)!)).toEqual([ENTRY]);
    expect(JSON.parse(target.get(KEYS.profile)!)).toEqual(PROFILE);
    expect(JSON.parse(target.get(KEYS.targets)!)).toEqual(TARGETS);
    expect(JSON.parse(target.get(KEYS.targetMode)!)).toBe("manual");
    expectMyTvorog(JSON.parse(target.get(KEYS.userFoods)!));
  });

  it("preserves FoodEntry exactly (id, createdAt, date, amount, unit, foodType)", () => {
    const store = stubStorage();
    const result = importBackupText(JSON.stringify(backupDoc()));
    expect(result.ok).toBe(true);
    const [stored] = JSON.parse(store.get(KEYS.entries)!) as FoodEntry[];
    expect(stored.id).toBe("entry-x");
    expect(stored.createdAt).toBe("2026-09-20T08:00:00.000Z");
    expect(stored.date).toBe("2026-09-20");
    expect(stored.mealType).toBe("lunch");
    expect(stored.amount).toBe(123.45);
    expect(stored.unit).toBe("piece");
    expect(stored.foodType).toBe("generic");
  });

  it("failed validation leaves existing data untouched (no partial import)", () => {
    const store = stubStorage();
    seedFullState(store);
    const before = store.get(KEYS.entries);

    const bad = parseBackupText(
      JSON.stringify(backupDoc({ entries: [{ nonsense: true }] })),
    );
    expect(bad.ok).toBe(false);

    // The UI never calls apply on failure; existing data is intact.
    expect(store.get(KEYS.entries)).toBe(before);
  });

  it("re-import does not duplicate entries (wholesale replace)", () => {
    const store = stubStorage();
    seedFullState(store);
    const text = JSON.stringify(buildBackup());

    importBackupText(text);
    const afterFirst = JSON.parse(store.get(KEYS.entries)!) as FoodEntry[];
    importBackupText(text);
    const afterSecond = JSON.parse(store.get(KEYS.entries)!) as FoodEntry[];

    expect(afterSecond).toEqual(afterFirst);
    expect(afterSecond).toHaveLength(1);
  });

  it("partial backup replaces only its own sections", () => {
    const store = stubStorage();
    seedFullState(store);
    const profileBefore = store.get(KEYS.profile);

    const result = importBackupText(
      JSON.stringify({ app: "nutritrack", version: 1, data: { entries: [] } }),
    );
    expect(result.ok).toBe(true);
    expect(JSON.parse(store.get(KEYS.entries)!)).toEqual([]);
    // Untouched section keeps its data.
    expect(store.get(KEYS.profile)).toBe(profileBefore);
  });

  it("applyBackup with a manual target mode preserves it", () => {
    const store = stubStorage();
    applyBackup({ targetMode: "manual", targets: TARGETS });
    expect(JSON.parse(store.get(KEYS.targetMode)!)).toBe("manual");
    expect(JSON.parse(store.get(KEYS.targets)!)).toEqual(TARGETS);
  });
});
