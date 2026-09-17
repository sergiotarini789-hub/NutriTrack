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
import {
  STORAGE_KEYS,
  loadEntries,
  loadProfile,
  loadTargets,
  saveEntries,
  saveProfile,
  saveTargets,
} from "./storage";
import type {
  FoodEntry,
  MealType,
  NutritionTargets,
  UserProfile,
} from "./types";

export interface AddEntryInput {
  foodId: string;
  mealType: MealType;
  amount: number;
  date?: string;
}

interface DiaryContextValue {
  /** True once data has been loaded from localStorage. */
  ready: boolean;
  entries: FoodEntry[];
  targets: NutritionTargets;
  profile: UserProfile;
  addEntry: (input: AddEntryInput) => void;
  removeEntry: (id: string) => void;
  setTargets: (targets: NutritionTargets) => void;
  setProfile: (profile: UserProfile) => void;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

function createEntryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Holds all diary data (food entries, targets, profile) and keeps it
 * in sync with localStorage. Also syncs between browser tabs.
 */
export function DiaryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [targets, setTargetsState] = useState<NutritionTargets>(
    DEFAULT_TARGETS,
  );
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    setEntries(loadEntries());
    setTargetsState(loadTargets());
    setProfileState(loadProfile());
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.entries) setEntries(loadEntries());
      else if (event.key === STORAGE_KEYS.targets) setTargetsState(loadTargets());
      else if (event.key === STORAGE_KEYS.profile) setProfileState(loadProfile());
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addEntry = useCallback((input: AddEntryInput) => {
    const entry: FoodEntry = {
      id: createEntryId(),
      foodId: input.foodId,
      mealType: input.mealType,
      amount: Math.round(input.amount * 10) / 10,
      date: input.date ?? todayKey(),
    };
    setEntries((previous) => {
      const next = [...previous, entry];
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

  const value = useMemo(
    () => ({
      ready,
      entries,
      targets,
      profile,
      addEntry,
      removeEntry,
      setTargets,
      setProfile,
    }),
    [
      ready,
      entries,
      targets,
      profile,
      addEntry,
      removeEntry,
      setTargets,
      setProfile,
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
