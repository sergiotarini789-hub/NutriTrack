"use client";

import { useEffect, useMemo, useRef } from "react";
import { Plus, Search, X } from "lucide-react";
import { CategoryChips } from "@/components/foods/CategoryChips";
import type { CategoryChip } from "@/components/foods/CategoryChips";
import { FREQUENT_FOOD_IDS } from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import {
  ALL_CATEGORY,
  CATEGORIES,
  categoryIcon,
  searchFoods,
} from "@/lib/food-data";
import { formatNumber } from "@/lib/format";
import { baseUnitLabel } from "@/lib/nutrition";
import type { FoodItem } from "@/lib/types";

const MAX_RESULTS = 30;
const FREQUENT_COUNT = 6;

interface FoodSearchProps {
  onSelect: (food: FoodItem) => void;
  /** Opens the custom food form. */
  onCreate?: () => void;
  /** Controlled query (kept by the parent when navigating between steps). */
  query: string;
  onQueryChange: (query: string) => void;
  /** Controlled category filter. */
  category: string;
  onCategoryChange: (category: string) => void;
}

/**
 * Search-first food picker used by the add-food sheet: instant search,
 * "Часто используемые" shortcuts (real usage history with a sensible
 * fallback) and category chips, over compact result rows.
 */
export function FoodSearch({
  onSelect,
  onCreate,
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: FoodSearchProps) {
  const { allFoods, entries, userFoods, findFood } = useDiary();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(
    () => searchFoods(allFoods, query, category),
    [allFoods, query, category],
  );
  const capped = results.slice(0, MAX_RESULTS);

  const categories = useMemo<CategoryChip[]>(() => {
    const list: CategoryChip[] = [
      { id: ALL_CATEGORY, name: "Все" },
      ...CATEGORIES.filter((item) => item.id !== "user").map((item) => ({
        id: item.id,
        name: item.name,
      })),
    ];
    if (userFoods.length > 0) {
      list.push({ id: "user", name: "Мои продукты" });
    }
    return list;
  }, [userFoods]);

  /** Most-used foods from the diary, padded with sensible defaults. */
  const frequent = useMemo<FoodItem[]>(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      counts.set(entry.foodId, (counts.get(entry.foodId) ?? 0) + 1);
    }
    const ranked = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => findFood(id))
      .filter((food): food is FoodItem => food !== undefined)
      .slice(0, FREQUENT_COUNT);

    const seen = new Set(ranked.map((food) => food.id));
    const fallback = FREQUENT_FOOD_IDS.map((id) => findFood(id)).filter(
      (food): food is FoodItem => food !== undefined && !seen.has(food.id),
    );
    return [...ranked, ...fallback].slice(0, FREQUENT_COUNT);
  }, [entries, findFood]);

  return (
    <div>
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && capped.length > 0) {
              onSelect(capped[0]);
            }
          }}
          placeholder="Поиск продукта..."
          aria-label="Поиск продукта"
          className="h-12 w-full rounded-2xl border border-transparent bg-foreground/[0.05] pl-11 pr-11 text-base text-foreground outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            aria-label="Очистить поиск"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Frequent shortcuts (only before typing) */}
      {!query && frequent.length > 0 && (
        <div className="mt-5">
          <p className="text-[13px] font-semibold text-muted-foreground">
            Часто используемые
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {frequent.map((food) => {
              const Icon = categoryIcon(food.category);
              return (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => onSelect(food)}
                  className="flex h-10 items-center gap-2 rounded-full bg-foreground/[0.06] pl-3 pr-3.5 text-sm font-medium text-foreground transition-[background-color,color,transform] duration-150 hover:bg-primary/10 hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {food.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mt-4">
        <CategoryChips
          categories={categories}
          selected={category}
          onSelect={onCategoryChange}
        />
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-[15px] font-medium text-foreground">
            Ничего не найдено
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Попробуйте изменить запрос
          </p>
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <Plus className="h-4 w-4" />
              Создать продукт
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="mt-3">
            {capped.map((food) => {
              const Icon = categoryIcon(food.category);
              return (
                <li key={food.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(food)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[15px] font-medium text-foreground">
                          {food.name}
                        </span>
                        {food.sourceType === "user" && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
                            Ваш
                          </span>
                        )}
                      </span>
                      <span className="mt-px block truncate text-xs text-muted-foreground">
                        Б {formatNumber(food.protein)} · Ж {formatNumber(food.fat)} · У{" "}
                        {formatNumber(food.carbs)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold tabular-nums text-foreground">
                        {formatNumber(food.calories)}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        ккал / 100 {baseUnitLabel(food)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {results.length > capped.length && (
            <p className="mt-3 text-center text-[13px] text-muted-foreground">
              Показаны первые {formatNumber(capped.length)} из{" "}
              {formatNumber(results.length)} — уточните запрос
            </p>
          )}
        </>
      )}
    </div>
  );
}
