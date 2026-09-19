"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { CategoryChips } from "@/components/foods/CategoryChips";
import type { CategoryChip } from "@/components/foods/CategoryChips";
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
import { recentFoodIds } from "@/lib/recent-foods";
import {
  baseUnitLabel,
  hasNutrition,
  nutritionOf,
} from "@/lib/nutrition";
import { useOffSearch } from "@/lib/off-search";
import type { FoodItem } from "@/lib/types";

const MAX_RESULTS = 30;
const MAX_OFF_RESULTS = 10;
const RECENT_COUNT = 6;

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
  /** External access to the search input (e.g. to focus it). */
  searchInputRef?: RefObject<HTMLInputElement | null>;
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
  searchInputRef,
}: FoodSearchProps) {
  const { allFoods, entries, userFoods, findFood, offProducts } = useDiary();
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? localInputRef;

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

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

  /** Recently logged foods from the real diary (Stage 11). No
   *  fabricated fallback — an empty diary hides the section. */
  const recent = useMemo<FoodItem[]>(() => {
    return recentFoodIds(entries, RECENT_COUNT)
      .map((id) => findFood(id))
      .filter((food): food is FoodItem => food !== undefined);
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

      {/* Recent foods from the diary (only before typing) */}
      {!query && recent.length > 0 && (
        <div className="mt-4">
          <p className="px-2.5 text-[13px] font-semibold text-muted-foreground">
            Недавние
          </p>
          <ul className="mt-1">
            {recent.map((food) => (
              <li key={food.id}>
                <ResultRow food={food} onSelect={onSelect} />
              </li>
            ))}
          </ul>
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
              {capped.map((food) => (
                <li key={food.id}>
                  <ResultRow food={food} onSelect={onSelect} />
                </li>
              ))}
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
                  Ищем продукты…
                </p>
              )}
              {remote.kind === "error" && (
                <p className="mt-2 px-2.5 text-[13px] text-muted-foreground">
                  Не удалось выполнить поиск
                </p>
              )}
              {offCapped.length > 0 && (
                <ul className="mt-1">
                  {offCapped.map((product) => (
                    <li key={product.id}>
                      <ResultRow food={product} onSelect={onSelect} />
                    </li>
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
              Ищем продукты…
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

/**
 * One search result row (Stage 11): fast scanning — name, brand when
 * available and the calorie reference. No macro breakdowns here; the
 * details live on the quantity step.
 */
function ResultRow({
  food,
  onSelect,
}: {
  food: FoodItem;
  onSelect: (food: FoodItem) => void;
}) {
  const Icon = categoryIcon(food.category);
  const nutrition = nutritionOf(food);
  const known = hasNutrition(food);
  // Second line only when it carries information: brand, or the
  // honest "no nutrition data" note. Never a redundant macro dump.
  const meta = food.brand ? food.brand : known ? null : "Нет данных о КБЖУ";
  return (
    <button
      type="button"
      onClick={() => onSelect(food)}
      className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
        {meta && (
          <span className="mt-px block truncate text-xs text-muted-foreground">
            {meta}
          </span>
        )}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold tabular-nums text-foreground">
          {known ? formatNumber(nutrition.calories) : "—"}
        </span>
        <span className="block text-[10px] text-muted-foreground">
          ккал / 100 {baseUnitLabel(food)}
        </span>
      </span>
    </button>
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
      title = "Ищем продукты…";
      hint = "Локально ничего не нашлось";
    } else if (remote.kind === "empty") {
      title = "Ничего не найдено";
      hint = "Попробуйте другое название или создайте свой продукт";
    } else if (remote.kind === "error") {
      title = "Не удалось выполнить поиск";
      hint = "Проверьте соединение или создайте свой продукт";
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
