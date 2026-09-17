"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { nutritionForAmount, parseAmountInput } from "@/lib/nutrition";
import type { FoodItem } from "@/lib/types";

const QUICK_AMOUNTS = [50, 100, 150, 200];
const STEP = 10;

interface FoodQuantityProps {
  food: FoodItem;
  /** Raw input value as text (allows free typing). */
  amount: string;
  onAmountChange: (value: string) => void;
  /** Called when the user presses Enter in the input. */
  onSubmit: () => void;
}

/** Amount stepper with live nutrition preview for the selected food. */
export function FoodQuantity({
  food,
  amount,
  onAmountChange,
  onSubmit,
}: FoodQuantityProps) {
  const parsed = parseAmountInput(amount);
  const valid = parsed !== null && parsed > 0;
  const nutrition = valid && parsed !== null ? nutritionForAmount(food, parsed) : null;
  const Icon = food.icon;

  function changeBy(delta: number) {
    const base = parsed !== null && parsed > 0 ? parsed : 0;
    const next = Math.max(1, Math.round(base + delta));
    onAmountChange(String(next));
  }

  return (
    <div>
      {/* Selected food */}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {food.name}
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {formatNumber(food.calories)} ккал / 100 г
          </p>
        </div>
      </div>

      {/* Amount */}
      <p className="mt-6 text-sm font-medium text-foreground">Количество</p>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => changeBy(-STEP)}
          aria-label="Уменьшить количество"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-foreground/5 active:bg-foreground/10"
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            aria-label="Количество"
            className={cn(
              "h-12 w-28 rounded-xl border bg-card text-center text-lg font-semibold tabular-nums text-foreground outline-none transition-colors focus:ring-2",
              valid
                ? "border-border focus:border-primary focus:ring-primary/20"
                : "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            )}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            г
          </span>
        </span>
        <button
          type="button"
          onClick={() => changeBy(STEP)}
          aria-label="Увеличить количество"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-foreground/5 active:bg-foreground/10"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Quick amounts */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onAmountChange(String(value))}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              parsed === value
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:bg-foreground/5",
            )}
          >
            {value} г
          </button>
        ))}
      </div>

      {!valid && (
        <p className="mt-3 text-center text-[13px] text-red-600 dark:text-red-400" role="alert">
          Введите количество больше 0
        </p>
      )}

      {/* Live nutrition preview */}
      <div className="mt-6 rounded-2xl border border-border bg-background/50 p-4">
        <p className="text-[13px] font-medium text-muted-foreground">
          Пищевая ценность
        </p>
        <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">
          {formatNumber(nutrition?.calories ?? 0)}{" "}
          <span className="text-sm font-medium text-muted-foreground">ккал</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Белки</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-protein">
              {formatNumber(nutrition?.protein ?? 0)} г
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Жиры</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-fat">
              {formatNumber(nutrition?.fat ?? 0)} г
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Углеводы</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-carbs">
              {formatNumber(nutrition?.carbs ?? 0)} г
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
