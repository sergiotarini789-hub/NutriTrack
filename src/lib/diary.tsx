"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { normalizeBarcode } from "./barcode";
import { findOffProductById, upsertOffProduct } from "./off-products";
import { OpenFoodFactsRepository } from "./openfoodfacts-repository";
import { EMPTY_PROFILE, DEFAULT_TARGETS } from "./app-data";
import {
  calculateNutritionGoals,
  resolveEffectiveTargets,
} from "./goals";
import { todayKey } from "./dates";
import { withRestoredEntry } from "./entry-restore";
import { LocalFoodRepository } from "./food-repository";
import {
  STORAGE_KEYS,
  loadEntries,
  loadOffProducts,
  loadProfile,
  loadTargetMode,
  loadTargets,
  loadUserFoods,
  saveEntries,
  saveProfile,
  saveTargetMode,
  saveTargets,
} from "./storage";
import type {
  BarcodeLookupResult,
  BrandedProduct,
  FoodEntry,
  FoodProduct,
  FoodProductType,
  MealType,
  NutritionGoals,
  NutritionTargets,
  TargetMode,
  UserProduct,
  UserProductInput,
  UserProductUpdate,
  UserProfile,
} from "./types";

export interface AddEntryInput {
  foodId: string;
  mealType: MealType;
  amount: number;
  unit: string;
  date?: string;
}

export interface UpdateEntryInput {
  amount: number;
  unit: string;
}

/**
 * Legacy name kept for components; identical to UserProductInput from
 * the product model.
 */
export type UserFoodInput = UserProductInput;

interface DiaryContextValue {
  /** True once data has been loaded from localStorage. */
  ready: boolean;
  entries: FoodEntry[];
  /**
   * Effective daily targets — the ONE source consumed by the dashboard
   * and Settings. Derived: manual mode → stored manual targets; auto
   * mode → calculated from the profile; auto mode with an INCOMPLETE
   * profile → null (no target — the UI must show an incomplete-profile
   * state, never a legacy placeholder like 2100 kcal).
   */
  targets: NutritionTargets | null;
  /**
   * The stored manual targets (editing basis for manual mode; seeded
   * from legacy stored data). Never affected by profile changes.
   */
  manualTargets: NutritionTargets;
  /**
   * Calculation details for the current profile in auto mode (bmr,
   * tdee, calorie target); null in manual mode or when the profile is
   * incomplete.
   */
  goals: NutritionGoals | null;
  /** Whether targets are calculated ("auto") or manual ("manual"). */
  targetMode: TargetMode;
  profile: UserProfile;
  /** Built-in and user-created products (via the local repository). */
  allFoods: FoodProduct[];
  userFoods: UserProduct[];
  /** Normalized Open Food Facts products fetched earlier. */
  offProducts: BrandedProduct[];
  /** Resolves any product (generic / branded / user) by id. */
  findFood: (id: string) => FoodProduct | undefined;
  /**
   * Resolves a barcode: local repository (user products win) → cached
   * OFF products → Open Food Facts via the server proxy. External
   * failure never breaks local lookups.
   */
  lookupBarcode: (barcode: string) => Promise<BarcodeLookupResult>;
  /**
   * Persists an Open Food Facts product chosen by the user (e.g. from
   * search results) into the local OFF store so diary entries can
   * resolve it offline. Idempotent by product id.
   */
  adoptOffProduct: (product: BrandedProduct) => void;
  addEntry: (input: AddEntryInput) => void;
  updateEntry: (id: string, changes: UpdateEntryInput) => void;
  removeEntry: (id: string) => void;
  /**
   * Stage 14B (undo): re-inserts a previously deleted entry EXACTLY
   * as it was — same id, createdAt, date, meal, amount, unit and
   * foodType. No new id, no re-stamping (unlike addEntry). Idempotent:
   * a no-op when an entry with the same id is already present.
   */
  restoreEntry: (entry: FoodEntry) => void;
  /**
   * Explicitly sets manual targets — switches the mode to "manual".
   * Profile changes never overwrite them afterwards.
   */
  setTargets: (targets: NutritionTargets) => void;
  /** Switches between calculated and manual targets. */
  setTargetMode: (mode: TargetMode) => void;
  setProfile: (profile: UserProfile) => void;
  addUserFood: (input: UserFoodInput) => FoodProduct;
  /** Updates a user product; returns it (or undefined when missing). */
  updateUserFood: (id: string, changes: UserProductUpdate) => UserProduct | undefined;
  deleteUserFood: (id: string) => void;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

/**
 * Holds all diary data (food entries, targets, profile, user products)
 * and keeps it in sync with localStorage. Product data access goes
 * through a LocalFoodRepository so the UI never depends on the
 * hardcoded food array directly. Also syncs between browser tabs.
 */
export function DiaryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [manualTargets, setManualTargetsState] =
    useState<NutritionTargets>(DEFAULT_TARGETS);
  const [targetMode, setTargetModeState] = useState<TargetMode>("auto");
  const [profile, setProfileState] = useState<UserProfile>(EMPTY_PROFILE);
  const [userFoods, setUserFoods] = useState<UserProduct[]>([]);
  const [offProducts, setOffProducts] = useState<BrandedProduct[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
    setManualTargetsState(loadTargets());
    setTargetModeState(loadTargetMode());
    setProfileState(loadProfile());
    setUserFoods(loadUserFoods());
    setOffProducts(loadOffProducts());
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.entries) setEntries(loadEntries());
      else if (event.key === STORAGE_KEYS.targets) {
        setManualTargetsState(loadTargets());
      } else if (event.key === STORAGE_KEYS.targetMode) {
        setTargetModeState(loadTargetMode());
      } else if (event.key === STORAGE_KEYS.profile) {
        setProfileState(loadProfile());
      }
      else if (event.key === STORAGE_KEYS.userFoods) setUserFoods(loadUserFoods());
      else if (event.key === STORAGE_KEYS.offProducts) {
        setOffProducts(loadOffProducts());
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const repository = useMemo(
    () => new LocalFoodRepository(userFoods),
    [userFoods],
  );

  const offRepository = useMemo(() => new OpenFoodFactsRepository(), []);

  const allFoods = useMemo(() => repository.getAll(), [repository]);

  const findFood = useCallback(
    (id: string) => repository.getById(id) ?? findOffProductById(id),
    [repository],
  );

  /**
   * Barcode resolution (Stage 7 fallback model):
   *   local repository (user products win) → cached OFF products →
   *   Open Food Facts (server proxy) → the UI offers manual entry.
   *
   * Deterministic rule: a UserProduct with the same barcode ALWAYS
   * wins over external data — stale OFF records can never override
   * something the user created explicitly.
   */
  const lookupBarcode = useCallback(
    async (barcode: string): Promise<BarcodeLookupResult> => {
      const normalized = normalizeBarcode(barcode);
      if (!normalized) return { status: "invalid" };

      // 1. Local: built-ins and user products (user wins by construction).
      const local = repository.getByBarcode(normalized);
      if (local) return { status: "found", product: local, origin: "local" };

      // 2. Previously fetched external products (offline-friendly).
      const cached = offProducts.find(
        (product) => product.barcode === normalized,
      );
      if (cached) return { status: "found", product: cached, origin: "local" };

      // 3. External lookup through the server proxy route.
      const remote = await offRepository.getByBarcode(normalized);
      if (remote.status === "found") {
        upsertOffProduct(remote.product as BrandedProduct);
        setOffProducts(loadOffProducts());
        // A user product created meanwhile still wins.
        const userProduct = repository.getByBarcode(normalized);
        if (userProduct) {
          return { status: "found", product: userProduct, origin: "local" };
        }
        return remote;
      }
      return remote;
    },
    [repository, offRepository, offProducts],
  );

  /**
   * Stage 8B: when the user picks an OFF search result, the product is
   * persisted (upsert by id) BEFORE the entry is created — the same
   * store the barcode flow uses, so resolution rules stay identical.
   */
  const adoptOffProduct = useCallback((product: BrandedProduct) => {
    upsertOffProduct(product);
    setOffProducts(loadOffProducts());
  }, []);

  const addEntry = useCallback(
    (input: AddEntryInput) => {
      setEntries((previous) => {
        // Stamp the product type and creation time on new entries.
        // findFood covers generic, user AND cached external products.
        const food = findFood(input.foodId);
        const foodType: FoodProductType | undefined = food?.type;
        const entry: FoodEntry = {
          id: createId("entry"),
          foodId: input.foodId,
          ...(foodType ? { foodType } : {}),
          mealType: input.mealType,
          amount: Math.round(input.amount * 100) / 100,
          unit: input.unit,
          date: input.date ?? todayKey(),
          createdAt: new Date().toISOString(),
        };
        const next = [...previous, entry];
        saveEntries(next);
        return next;
      });
    },
    [findFood],
  );

  const updateEntry = useCallback((id: string, changes: UpdateEntryInput) => {
    setEntries((previous) => {
      const next = previous.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              amount: Math.round(changes.amount * 100) / 100,
              unit: changes.unit,
            }
          : entry,
      );
      saveEntries(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((previous) => {
      const next = previous.filter((entry) => entry.id !== id);
      saveEntries(next);
      return next;
    });
  }, []);

  const restoreEntry = useCallback((entry: FoodEntry) => {
    setEntries((previous) => {
      const next = withRestoredEntry(previous, entry);
      // No-op restore: keep the previous array reference so React
      // skips the re-render and nothing is re-written to storage.
      if (next === previous) return previous;
      saveEntries(next);
      return next;
    });
  }, []);

  // Derived state: the effective targets always come from the profile
  // (auto; null while the profile is incomplete) or the stored manual
  // values — Settings and the dashboard consume this single result,
  // never their own calculations.
  const goals = useMemo(
    () => (targetMode === "auto" ? calculateNutritionGoals(profile) : null),
    [targetMode, profile],
  );
  const targets = useMemo(
    () => resolveEffectiveTargets(profile, targetMode, manualTargets),
    [profile, targetMode, manualTargets],
  );

  const setTargets = useCallback((next: NutritionTargets) => {
    // Editing a target value is an explicit choice of manual targets.
    setManualTargetsState(next);
    saveTargets(next);
    setTargetModeState("manual");
    saveTargetMode("manual");
  }, []);

  const setTargetMode = useCallback((mode: TargetMode) => {
    setTargetModeState(mode);
    saveTargetMode(mode);
  }, []);

  const setProfile = useCallback((next: UserProfile) => {
    setProfileState(next);
    saveProfile(next);
  }, []);

  const addUserFood = useCallback(
    (input: UserFoodInput): FoodProduct => {
      // The repository builds the product and persists it; the state
      // mirrors the storage (single source of truth).
      const product = repository.createUserProduct(input);
      setUserFoods(loadUserFoods());
      return product;
    },
    [repository],
  );

  const updateUserFood = useCallback(
    (id: string, changes: UserProductUpdate) => {
      const updated = repository.updateUserProduct(id, changes);
      setUserFoods(loadUserFoods());
      return updated;
    },
    [repository],
  );

  const deleteUserFood = useCallback(
    (id: string) => {
      repository.deleteUserProduct(id);
      setUserFoods(loadUserFoods());
    },
    [repository],
  );

  const value = useMemo(
    () => ({
      ready,
      entries,
      targets,
      manualTargets,
      goals,
      targetMode,
      profile,
      allFoods,
      userFoods,
      offProducts,
      findFood,
      lookupBarcode,
      adoptOffProduct,
      addEntry,
      updateEntry,
      removeEntry,
      restoreEntry,
      setTargets,
      setTargetMode,
      setProfile,
      addUserFood,
      updateUserFood,
      deleteUserFood,
    }),
    [
      ready,
      entries,
      targets,
      manualTargets,
      goals,
      targetMode,
      profile,
      allFoods,
      userFoods,
      offProducts,
      findFood,
      lookupBarcode,
      adoptOffProduct,
      addEntry,
      updateEntry,
      removeEntry,
      restoreEntry,
      setTargets,
      setTargetMode,
      setProfile,
      addUserFood,
      updateUserFood,
      deleteUserFood,
    ],
  );

  return (
    <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>
  );
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useDiary(): DiaryContextValue {
  const context = useContext(DiaryContext);
  if (!context) {
    throw new Error("useDiary must be used within a DiaryProvider");
  }
  return context;
}
