"use client";

import { useEffect, useMemo, useRef } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
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
import {
  dedupeAgainstLocal,
  mergeOffResults,
  searchOffCache,
} from "@/lib/hybrid-search";
import { formatNumber } from "@/lib/format";
import {
  baseUnitLabel,
  hasNutrition,
  nutritionOf,
} from "@/lib/nutrition";
import { useOffSearch } from "@/lib/off-search";
import type { BrandedProduct, FoodItem } from "@/lib/types";

const MAX_RESULTS = 30;
const MAX_OFF_RESULTS = 10;
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
 * Search-first food picker used by the add-food sheet. Stage 8B makes
 * the catalog hybrid: instant LOCAL results (built-in + user products,
 * category chips active) and, for meaningful queries, a debounced
 * Open Food Facts section below (cached products merged with fresh
 * remote results, deduplicated — local products always win). Remote
 * failures never break the local list.
 */
export function FoodSearch({
  onSelect,
  onCreate,
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: FoodSearchProps) {
  const { allFoods, entries, userFoods, findFood, offProducts } = useDiary();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(
    () => searchFoods(allFoods, query, category),
    [allFoods, query, category],
  );
  const capped = results.slice(0, MAX_RESULTS);

  // Remote search only for meaningful queries (≥ 2 chars after trim).
  const remoteQueryActive = query.trim().length >= 2;
  const remote = useOffSearch(query);

  // Source B: cached OFF products, matched locally (category filter
  // applies — cached products carry a mapped NutriTrack category).
  const cachedMatches = useMemo(
    () => (remoteQueryActive ? searchOffCache(offProducts, query, category) : []),
    [remoteQueryActive, offProducts, query, category],
  );

  // Sources B+C merged and deduplicated against local results.
  const offResults = useMemo(() => {
    if (!remoteQueryActive) return [];
    const remoteProducts =
      remote.kind === "ok" && remote.query === query.trim()
        ? remote.products
        : [];
    return dedupeAgainstLocal(
      results,
      mergeOffResults(cachedMatches, remoteProducts),
    );
  }, [remoteQueryActive, remote, query, cachedMatches, results]);

  const offCapped = offResults.slice(0, MAX_OFF_RESULTS);
  // The section shows only when it has something to show: results
  // (cached or remote), a running search or a failure. A remote "empty"
  // with no cached matches keeps it hidden so the honest empty card of
  // the whole search can render instead.
  const offSectionVisible =
    remoteQueryActive &&
    (offCapped.length > 0 || remote.kind === "loading" || remote.kind === "error");

  const categories = useMemo<CategoryChip[]>(() => {
    const list: CategoryChip[] = [
      { id: ALL_CATEGORY, name: "Все" },
      ...CATEGORIES.filter((item) => item.id !== "user").map((item) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
      })),
    ];
    if (userFoods.length > 0) {
      list.push({
        id: "user",
        name: "Мои продукты",
        icon: CATEGORIES.find((item) => item.id === "user")?.icon,
      });
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

  /** Enter picks the first visible result (local first, then OFF). */
  function handleEnter() {
    if (capped.length > 0) {
      onSelect(capped[0]);
    } else if (offCapped.length > 0) {
      onSelect(offCapped[0]);
    }
  }

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
            if (event.key === "Enter") handleEnter();
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
      {results.length === 0 && !offSectionVisible ? (
        <EmptyState
          remote={remote}
          remoteActive={remoteQueryActive}
          onCreate={onCreate}
        />
      ) : (
        <>
          {results.length > 0 && (
            <div className="mt-3">
              {remoteQueryActive && <SectionLabel>Локальная база</SectionLabel>}
              <ul>
              {capped.map((food) => {
                const Icon = categoryIcon(food.category);
                const nutrition = nutritionOf(food);
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
                          {hasNutrition(food) ? (
                            <>
                              Б {formatNumber(nutrition.protein)} · Ж{" "}
                              {formatNumber(nutrition.fat)} · У{" "}
                              {formatNumber(nutrition.carbs)}
                            </>
                          ) : (
                            "Нет данных о КБЖУ"
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-bold tabular-nums text-foreground">
                          {hasNutrition(food)
                            ? formatNumber(nutrition.calories)
                            : "—"}
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
            </div>
          )}
          {results.length > capped.length && (
            <p className="mt-3 text-center text-[13px] text-muted-foreground">
              Показаны первые {formatNumber(capped.length)} из{" "}
              {formatNumber(results.length)} — уточните запрос
            </p>
          )}

          {/* Open Food Facts section (hybrid search, Stage 8B) */}
          {offSectionVisible && (
            <div className="mt-4">
              <SectionLabel>Open Food Facts</SectionLabel>
              {remote.kind === "loading" && (
                <p className="mt-2 flex items-center gap-2 px-2.5 text-[13px] font-medium text-muted-foreground">
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden
                  />
                  Поиск продуктов…
                </p>
              )}
              {remote.kind === "error" && (
                <p className="mt-2 px-2.5 text-[13px] text-muted-foreground">
                  Онлайн-поиск временно недоступен
                </p>
              )}
              {offCapped.length > 0 && (
                <ul className="mt-1">
                  {offCapped.map((product) => (
                    <OffResultRow
                      key={product.id}
                      product={product}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              )}
              {offResults.length > offCapped.length && (
                <p className="mt-2 px-2.5 text-[13px] text-muted-foreground">
                  Показаны первые {formatNumber(offCapped.length)} из{" "}
                  {formatNumber(offResults.length)}
                </p>
              )}
            </div>
          )}

          {/* Local empty + remote still working */}
          {results.length === 0 && remote.kind === "loading" && (
            <p className="mt-4 text-center text-[13px] text-muted-foreground">
              Ищем продукт онлайн…
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** Small section label reused for both result groups. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
      {children}
    </p>
  );
}

/** One Open Food Facts result row (branded product). */
function OffResultRow({
  product,
  onSelect,
}: {
  product: BrandedProduct;
  onSelect: (food: FoodItem) => void;
}) {
  const Icon = categoryIcon(product.category);
  const nutrition = nutritionOf(product);
  const known = hasNutrition(product);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.06] text-muted-foreground">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium text-foreground">
            {product.name}
          </span>
          <span className="mt-px block truncate text-xs text-muted-foreground">
            {product.brand && (
              <span className="font-semibold text-foreground/80">
                {product.brand}
                {" · "}
              </span>
            )}
            {known ? (
              <>
                Б {formatNumber(nutrition.protein)} · Ж{" "}
                {formatNumber(nutrition.fat)} · У {formatNumber(nutrition.carbs)}
              </>
            ) : (
              "Нет данных о КБЖУ"
            )}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-bold tabular-nums text-foreground">
            {known ? formatNumber(nutrition.calories) : "—"}
          </span>
          <span className="block text-[10px] text-muted-foreground">
            ккал / 100 {baseUnitLabel(product)}
          </span>
        </span>
      </button>
    </li>
  );
}

/** Empty-search card with honest messaging per remote state. */
function EmptyState({
  remote,
  remoteActive,
  onCreate,
}: {
  remote: ReturnType<typeof useOffSearch>;
  remoteActive: boolean;
  onCreate?: () => void;
}) {
  let title = "Ничего не найдено";
  let hint = "Попробуйте изменить запрос";
  if (remoteActive) {
    if (remote.kind === "loading") {
      title = "Ищем продукт онлайн…";
      hint = "Локально ничего не нашлось";
    } else if (remote.kind === "empty") {
      title = "Ничего не нашли";
      hint = "Попробуйте другое название или добавьте продукт вручную";
    } else if (remote.kind === "error") {
      title = "Онлайн-поиск временно недоступен";
      hint = "Попробуйте другое название или добавьте продукт вручную";
    }
  }
  return (
    <div className="mt-4 rounded-3xl border border-dashed border-border px-6 py-10 text-center">
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>
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
  );
}
