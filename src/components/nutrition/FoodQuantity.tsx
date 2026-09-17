"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { categoryIcon } from "@/lib/food-data";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import {
  baseUnitLabel,
  convertAmount,
  formatAmountInUnit,
  formatServing,
  minForUnit,
  nutritionForServing,
  parseAmountInput,
  stepForUnit,
  toBaseAmount,
  unitLabelFor,
} from "@/lib/nutrition";
import type { FoodItem } from "@/lib/types";

const MAX_QUICK_SERVINGS = 8;

interface FoodQuantityProps {
  food: FoodItem;
  /** Raw input value as text (allows free typing). */
  amount: string;
  unitKey: string;
  onAmountChange: (value: string) => void;
  onUnitChange: (unitKey: string) => void;
  /** Called when the user presses Enter in the input. */
  onSubmit: () => void;
}

/** Amount editor with unit selector, quick servings and live nutrition. */
export function FoodQuantity({
  food,
  amount,
  unitKey,
  onAmountChange,
  onUnitChange,
  onSubmit,
}: FoodQuantityProps) {
  const parsed = parseAmountInput(amount);
  const valid = parsed !== null && parsed > 0;
  const nutrition =
    valid && parsed !== null ? nutritionForServing(food, parsed, unitKey) : null;
  const Icon = categoryIcon(food.category);
  const step = stepForUnit(unitKey, food);
  const min = minForUnit(unitKey, food);
  const isBase = unitKey === food.baseUnit;

  function changeBy(delta: number) {
    const base = parsed !== null && parsed > 0 ? parsed : 0;
    const next = Math.max(min, Math.round((base + delta) * 100) / 100);
    onAmountChange(formatNumber(next));
  }

  function handleUnitChange(nextUnitKey: string) {
    if (nextUnitKey === unitKey) return;
    if (parsed !== null && parsed > 0) {
      // Keep the nutrition the same when switching units.
      const converted = convertAmount(food, parsed, unitKey, nextUnitKey);
      onAmountChange(formatNumber(converted));
    }
    onUnitChange(nextUnitKey);
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
            {formatNumber(food.calories)} ккал / 100 {baseUnitLabel(food)}
          </p>
        </div>
      </div>

      {/* Amount */}
      <p className="mt-6 text-sm font-medium text-foreground">Количество</p>
      <div className="mt-2 flex items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => changeBy(-step)}
          aria-label="Уменьшить количество"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-foreground/5 active:bg-foreground/10"
        >
          <Minus className="h-5 w-5" />
        </button>

        <span
          className={cn(
            "flex h-12 items-stretch overflow-hidden rounded-xl border bg-card focus-within:ring-2",
            valid
              ? "border-border focus-within:border-primary focus-within:ring-primary/20"
              : "border-red-500 focus-within:ring-red-500/20",
          )}
        >
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            aria-label="Количество"
            className="h-full w-[4.5rem] bg-transparent px-2 text-center text-lg font-semibold tabular-nums text-foreground outline-none"
          />
          <span className="relative flex items-stretch">
            <select
              value={unitKey}
              onChange={(event) => handleUnitChange(event.target.value)}
              aria-label="Единица измерения"
              className="h-full cursor-pointer appearance-none border-l border-border bg-card py-0 pl-2.5 pr-7 text-[15px] font-medium text-foreground outline-none"
            >
              {food.units.map((option) => (
                <option key={option.key} value={option.key}>
                  {parsed !== null && parsed > 0
                    ? unitLabelFor(option, parsed)
                    : option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </span>
        </span>

        <button
          type="button"
          onClick={() => changeBy(step)}
          aria-label="Увеличить количество"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-foreground/5 active:bg-foreground/10"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Base-unit equivalent */}
      {valid && parsed !== null && !isBase && (
        <p className="mt-2 text-center text-[13px] text-muted-foreground">
          ≈ {formatNumber(toBaseAmount(food, parsed, unitKey))}{" "}
          {baseUnitLabel(food)}
        </p>
      )}

      {/* Quick servings */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {food.servingOptions.slice(0, MAX_QUICK_SERVINGS).map((serving) => {
          const active =
            parsed !== null &&
            parsed > 0 &&
            serving.amount === parsed &&
            serving.unitKey === unitKey;
          return (
            <button
              key={`${serving.unitKey}-${serving.amount}`}
              type="button"
              onClick={() => {
                onAmountChange(formatNumber(serving.amount));
                onUnitChange(serving.unitKey);
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:bg-foreground/5",
              )}
            >
              {formatServing(food, serving)}
            </button>
          );
        })}
      </div>

      {!valid && (
        <p
          className="mt-3 text-center text-[13px] text-red-600 dark:text-red-400"
          role="alert"
        >
          Введите количество больше 0
        </p>
      )}

      {/* Live nutrition preview */}
      <div className="mt-6 rounded-2xl border border-border bg-background/50 p-4">
        <p className="text-[13px] font-medium text-muted-foreground">
          Пищевая ценность
          {valid && parsed !== null && (
            <span className="ml-1 text-muted-foreground/70">
              ({formatAmountInUnit(food, parsed, unitKey)})
            </span>
          )}
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
