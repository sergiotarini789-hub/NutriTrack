"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MealFoodList } from "@/components/nutrition/MealFoodList";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import {
  formatEntryAmount,
  nutritionOfEntries,
  type ResolvedEntry,
} from "@/lib/nutrition";
import type { MealType } from "@/lib/types";

interface MealCardProps {
  mealId: MealType;
  name: string;
  icon: LucideIcon;
  /** Food entries of this meal for the current day. */
  items: ResolvedEntry[];
  onAdd: () => void;
}

/**
 * One meal inside the unified diary surface: header with icon, name,
 * calorie total and a quick-add button; compact food rows expand
 * underneath. Meals with entries start expanded.
 */
export function MealCard({
  mealId,
  name,
  icon: Icon,
  items,
  onAdd,
}: MealCardProps) {
  const [open, setOpen] = useState(items.length > 0);
  const totals = nutritionOfEntries(items);
  const empty = items.length === 0;

  const names = items
    .slice(0, 2)
    .map(
      ({ entry, food }) =>
        `${food.name} · ${formatEntryAmount(food, entry.amount, entry.unit, {
          withBase: false,
        })}`,
    )
    .join(", ");
  const preview = empty
    ? "Ничего не добавлено"
    : items.length > 2
      ? `${names} +${items.length - 2}`
      : names;

  return (
    <section aria-label={name}>
      <div className="flex items-center gap-2.5 py-3 pl-3 pr-3 sm:gap-3 sm:pl-4">
        {/* Header body: toggles the food list (or adds when empty) */}
        <button
          type="button"
          onClick={() => (empty ? onAdd() : setOpen((value) => !value))}
          aria-expanded={empty ? undefined : open}
          aria-controls={empty ? undefined : `${mealId}-content`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 text-left transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold text-foreground">
                {name}
              </span>
              {!empty && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              )}
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
              {preview}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span
              className={cn(
                "text-base font-bold tabular-nums",
                empty ? "text-muted-foreground/50" : "text-foreground",
              )}
            >
              {empty ? "—" : formatNumber(totals.calories)}
            </span>
            {!empty && (
              <span className="block text-[11px] text-muted-foreground">
                ккал
              </span>
            )}
          </span>
        </button>

        {/* Quick add */}
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Добавить еду: ${name}`}
          title={`Добавить еду: ${name}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground transition-[background-color,color,transform] duration-150 hover:bg-primary/10 hover:text-primary active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>

      {open && !empty && (
        <div id={`${mealId}-content`} className="animate-step-in pb-3 pl-4 pr-3 sm:pl-5">
          <MealFoodList items={items} />
        </div>
      )}
    </section>
  );
}
