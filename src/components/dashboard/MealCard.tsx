"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { nutritionOfEntries } from "@/lib/nutrition";
import type { LucideIcon } from "lucide-react";
import type { MealType } from "@/lib/types";
import type { ResolvedEntry } from "@/lib/nutrition";
import { MealFoodList } from "@/components/nutrition/MealFoodList";
import type { MealToastNotify } from "@/components/nutrition/MealFoodList";

interface MealCardProps {
  mealId: MealType;
  name: string;
  icon: LucideIcon;
  items: ResolvedEntry[];
  onAdd: () => void;
  /** Stage 14B: forwarded to the meal list (toast owned by Dashboard). */
  onToast: MealToastNotify;
}

/**
 * Meal section (Stage 10): «Завтрак / 520 ккал» header over a list of
 * entries — native app feel rather than a heavy card with a giant
 * quick-add circle. Non-empty meals start expanded; the header
 * collapses/expands with a chevron. Empty meals get a short honest
 * line and the same quiet add row.
 */
export function MealCard({ name, icon: Icon, items, onAdd, onToast }: MealCardProps) {
  const [open, setOpen] = useState(items.length > 0);
  const totals = nutritionOfEntries(items);
  const empty = items.length === 0;

  return (
    <section
      aria-label={name}
      className="overflow-hidden rounded-2xl bg-card shadow-sm shadow-black/[0.03]"
    >
      {/* Header: icon + name + kcal; collapses/expands when non-empty */}
      <div className="flex items-center gap-2 px-4 py-3 sm:px-5">
        {empty ? (
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Icon
              className="h-[18px] w-[18px] shrink-0 text-primary"
              strokeWidth={2}
            />
            <h3 className="text-[15px] font-semibold text-foreground">
              {name}
            </h3>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Icon
              className="h-[18px] w-[18px] shrink-0 text-primary"
              strokeWidth={2}
            />
            <h3 className="text-[15px] font-semibold text-foreground">
              {name}
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground/60",
                "transition-transform duration-200 motion-reduce:transition-none",
                open && "rotate-180",
              )}
            />
          </button>
        )}
        {!empty && (
          <p className="shrink-0 text-[14px] tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatNumber(Math.round(totals.calories))}
            </span>{" "}
            ккал
          </p>
        )}
      </div>

      {empty ? (
        <p className="px-4 pb-1 text-[13px] text-muted-foreground sm:px-5">
          Пока ничего не добавлено
        </p>
      ) : (
        open && (
          <div className="px-2 pb-2 pt-0.5 sm:px-3">
            <MealFoodList items={items} onToast={onToast} />
          </div>
        )
      )}

      {/* Quiet full-width add row for this meal */}
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Добавить еду: ${name}`}
        className="flex h-11 w-full items-center justify-center gap-1.5 border-t border-border/50 text-[14px] font-medium text-primary transition-colors hover:bg-primary/[0.05] active:bg-primary/10 focus-visible:outline-none focus-visible:bg-primary/[0.05]"
      >
        + Добавить еду
      </button>
    </section>
  );
}
