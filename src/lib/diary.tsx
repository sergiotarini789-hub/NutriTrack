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
import { DEFAULT_PROFILE, DEFAULT_TARGETS } from "./app-data";
import { todayKey } from "./dates";
import { G_UNIT, ML_UNIT, foods as builtInFoods } from "./food-data";
import {
  STORAGE_KEYS,
  loadEntries,
  loadProfile,
  loadTargets,
  loadUserFoods,
  saveEntries,
  saveProfile,
  saveTargets,
  saveUserFoods,
} from "./storage";
import type {
  FoodEntry,
  FoodItem,
  MealType,
  NutritionTargets,
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

/** Data needed to create a custom food. */
export interface UserFoodInput {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  baseUnit: "g" | "ml";
  portionSize?: number | null;
  isBranded?: boolean;
}

interface DiaryContextValue {
  /** True once data has been loaded from localStorage. */
  ready: boolean;
  entries: FoodEntry[];
  targets: NutritionTargets;
  profile: UserProfile;
  /** Built-in and user-created foods. */
  allFoods: FoodItem[];
  userFoods: FoodItem[];
  findFood: (id: string) => FoodItem | undefined;
  addEntry: (input: AddEntryInput) => void;
  updateEntry: (id: string, changes: UpdateEntryInput) => void;
  removeEntry: (id: string) => void;
  setTargets: (targets: NutritionTargets) => void;
  setProfile: (profile: UserProfile) => void;
  addUserFood: (input: UserFoodInput) => FoodItem;
  deleteUserFood: (id: string) => void;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Holds all diary data (food entries, targets, profile, user foods) and
 * keeps it in sync with localStorage. Also syncs between browser tabs.
 */
export function DiaryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [targets, setTargetsState] = useState<NutritionTargets>(
    DEFAULT_TARGETS,
  );
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [userFoods, setUserFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
    setTargetsState(loadTargets());
    setProfileState(loadProfile());
    setUserFoods(loadUserFoods());
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.entries) setEntries(loadEntries());
      else if (event.key === STORAGE_KEYS.targets) setTargetsState(loadTargets());
      else if (event.key === STORAGE_KEYS.profile) setProfileState(loadProfile());
      else if (event.key === STORAGE_KEYS.userFoods) setUserFoods(loadUserFoods());
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const allFoods = useMemo(
    () => [...userFoods, ...builtInFoods],
    [userFoods],
  );

  const foodIndex = useMemo(() => {
    const index = new Map<string, FoodItem>();
    for (const food of allFoods) index.set(food.id, food);
    return index;
  }, [allFoods]);

  const findFood = useCallback(
    (id: string) => foodIndex.get(id),
    [foodIndex],
  );

  const addEntry = useCallback((input: AddEntryInput) => {
    const entry: FoodEntry = {
      id: createId("entry"),
      foodId: input.foodId,
      mealType: input.mealType,
      amount: Math.round(input.amount * 100) / 100,
      unit: input.unit,
      date: input.date ?? todayKey(),
    };
    setEntries((previous) => {
      const next = [...previous, entry];
      saveEntries(next);
      return next;
    });
  }, []);

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

  const addUserFood = useCallback((input: UserFoodInput): FoodItem => {
    const baseUnitKey = input.baseUnit;
    const baseUnit = baseUnitKey === "ml" ? ML_UNIT : G_UNIT;
    const units =
      input.portionSize && input.portionSize > 0
        ? [
            {
              key: "serving",
              kind: "serving" as const,
              label: "порция",
              few: "порции",
              many: "порций",
              base: input.portionSize,
            },
            baseUnit,
          ]
        : [baseUnit];
    const servingOptions =
      input.portionSize && input.portionSize > 0
        ? [
            { amount: 1, unitKey: "serving" },
            { amount: 100, unitKey: baseUnitKey },
          ]
        : baseUnitKey === "ml"
          ? [
              { amount: 100, unitKey: "ml" },
              { amount: 200, unitKey: "ml" },
              { amount: 250, unitKey: "ml" },
            ]
          : [
              { amount: 50, unitKey: "g" },
              { amount: 100, unitKey: "g" },
              { amount: 150, unitKey: "g" },
            ];

    const food: FoodItem = {
      id: createId("user"),
      name: input.name.trim(),
      category: "user",
      aliases: [],
      calories: input.calories,
      protein: input.protein,
      fat: input.fat,
      carbs: input.carbs,
      baseUnit: input.baseUnit,
      units,
      servingOptions,
      defaultServing:
        input.portionSize && input.portionSize > 0
          ? { amount: 1, unitKey: "serving" }
          : { amount: 100, unitKey: baseUnitKey },
      sourceType: "user",
      sourceName: "Пользователь",
      isBranded: input.isBranded === true,
    };

    setUserFoods((previous) => {
      const next = [food, ...previous];
      saveUserFoods(next);
      return next;
    });
    return food;
  }, []);

  const deleteUserFood = useCallback((id: string) => {
    setUserFoods((previous) => {
      const next = previous.filter((food) => food.id !== id);
      saveUserFoods(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      entries,
      targets,
      profile,
      allFoods,
      userFoods,
      findFood,
      addEntry,
      updateEntry,
      removeEntry,
      setTargets,
      setProfile,
      addUserFood,
      deleteUserFood,
    }),
    [
      ready,
      entries,
      targets,
      profile,
      allFoods,
      userFoods,
      findFood,
      addEntry,
      updateEntry,
      removeEntry,
      setTargets,
      setProfile,
      addUserFood,
      deleteUserFood,
    ],
  );

  return (
    <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>
  );
}

export function useDiary(): DiaryContextValue {
  const context = useContext(DiaryContext);
  if (!context) {
    throw new Error("useDiary must be used within a DiaryProvider");
  }
  return context;
}
