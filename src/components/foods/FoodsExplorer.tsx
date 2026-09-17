"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatNumber, pluralize } from "@/lib/format";
import { foods } from "@/lib/mock-data";
import { FoodCard } from "./FoodCard";

/** Food database screen body with client-side search over mock data. */
export function FoodsExplorer() {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      normalized
        ? foods.filter((food) => food.name.toLowerCase().includes(normalized))
        : foods,
    [normalized],
  );

  return (
    <div>
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск продукта..."
          aria-label="Поиск продукта"
          className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-11 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Очистить поиск"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {filtered.length > 0
          ? `Найдено: ${formatNumber(filtered.length)} ${pluralize(
              filtered.length,
              "продукт",
              "продукта",
              "продуктов",
            )}`
          : "Ничего не найдено"}
      </p>

      {/* Results */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((food) => (
          <FoodCard key={food.id} food={food} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
            <SearchX className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] font-medium text-foreground">
            Ничего не найдено
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Попробуйте изменить запрос
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => setQuery("")}
          >
            Очистить поиск
          </Button>
        </div>
      )}
    </div>
  );
}
