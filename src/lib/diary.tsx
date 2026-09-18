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
import { DEFAULT_PROFILE, DEFAULT_TARGETS } from "./app-data";
import { todayKey } from "./dates";
import { LocalFoodRepository } from "./food-repository";
import {
  STORAGE_KEYS,
  loadEntries,
  loadOffProducts,
  loadProfile,
  loadTargets,
  loadUserFoods,
  saveEntries,
  saveProfile,
  saveTargets,
} from "./storage";
import type {
  BarcodeLookupResult,
  BrandedProduct,
  FoodEntry,
  FoodProduct,
  FoodProductType,
  MealType,
  NutritionTargets,
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
  targets: NutritionTargets;
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
  addEntry: (input: AddEntryInput) => void;
  updateEntry: (id: string, changes: UpdateEntryInput) => void;
  removeEntry: (id: string) => void;
  setTargets: (targets: NutritionTargets) => void;
  setProfile: (profile: UserProfile) => void;
  addUserFood: (input: UserFoodInput) => FoodProduct;
  updateUserFood: (id: string, changes: UserProductUpdate) => void;
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
  const [targets, setTargetsState] = useState<NutritionTargets>(
    DEFAULT_TARGETS,
  );
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [userFoods, setUserFoods] = useState<UserProduct[]>([]);
  const [offProducts, setOffProducts] = useState<BrandedProduct[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
    setTargetsState(loadTargets());
    setProfileState(loadProfile());
    setUserFoods(loadUserFoods());
    setOffProducts(loadOffProducts());
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.entries) setEntries(loadEntries());
      else if (event.key === STORAGE_KEYS.targets) setTargetsState(loadTargets());
      else if (event.key === STORAGE_KEYS.profile) setProfileState(loadProfile());
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

  const setTargets = useCallback((next: NutritionTargets) => {
    setTargetsState(next);
    saveTargets(next);
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
      repository.updateUserProduct(id, changes);
      setUserFoods(loadUserFoods());
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
      profile,
      allFoods,
      userFoods,
      offProducts,
      findFood,
      lookupBarcode,
      addEntry,
      updateEntry,
      removeEntry,
      setTargets,
      setProfile,
      addUserFood,
      updateUserFood,
      deleteUserFood,
    }),
    [
      ready,
      entries,
      targets,
      profile,
      allFoods,
      userFoods,
      offProducts,
      findFood,
      lookupBarcode,
      addEntry,
      updateEntry,
      removeEntry,
      setTargets,
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
