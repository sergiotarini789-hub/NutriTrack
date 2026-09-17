"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MealFoodList } from "@/components/nutrition/MealFoodList";
import { Card } from "@/components/ui/Card";
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
 * Expandable meal card: header with total calories, expandable list of
 * foods with edit/delete controls and a quick add button.
 */
export function MealCard({
  mealId,
  name,
  icon: Icon,
  items,
  onAdd,
}: MealCardProps) {
  const [open, setOpen] = useState(false);
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
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`${mealId}-content`}
        className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-foreground">
            {name}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-[13px]",
              empty ? "text-muted-foreground/80" : "text-muted-foreground",
            )}
          >
            {preview}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span
            className={cn(
              "text-base font-semibold tabular-nums",
              empty ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {formatNumber(totals.calories)}
          </span>{" "}
          <span className="text-[13px] text-muted-foreground">ккал</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div id={`${mealId}-content`} className="border-t border-border px-4 pb-4 pt-1 sm:px-5">
          {empty ? (
            <p className="py-3 text-center text-[13px] text-muted-foreground">
              Ничего не добавлено
            </p>
          ) : (
            <MealFoodList items={items} />
          )}
          <button
            type="button"
            onClick={onAdd}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        </div>
      )}
    </Card>
  );
}
