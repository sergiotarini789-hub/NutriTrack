"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { foods } from "@/lib/food-data";
import { formatNumber } from "@/lib/format";
import type { FoodItem } from "@/lib/types";

interface FoodSearchProps {
  onSelect: (food: FoodItem) => void;
}

/** Real-time search over the local food database. */
export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const normalized = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      normalized
        ? foods.filter((food) => food.name.toLowerCase().includes(normalized))
        : foods,
    [normalized],
  );

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results.length > 0) {
              onSelect(results[0]);
            }
          }}
          placeholder="Поиск продукта..."
          aria-label="Поиск продукта"
          className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-11 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Очистить поиск"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-[15px] font-medium text-foreground">
            Ничего не найдено
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Попробуйте изменить запрос
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {results.map((food) => {
            const Icon = food.icon;
            return (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() => onSelect(food)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-foreground">
                      {food.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Б {formatNumber(food.protein)} г · Ж {formatNumber(food.fat)} г · У{" "}
                      {formatNumber(food.carbs)} г
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-foreground">
                      {formatNumber(food.calories)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      ккал / 100 г
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
