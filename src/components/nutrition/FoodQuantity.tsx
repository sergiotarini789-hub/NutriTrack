"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { MEALS } from "@/lib/app-data";
import { categoryIcon, getCategory } from "@/lib/food-data";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import {
  baseUnitLabel,
  convertAmount,
  hasNutrition,
  formatAmountInUnit,
  formatServing,
  minForUnit,
  nutritionForServing,
  parseAmountInput,
  sourceLabelOf,
  stepForUnit,
  toBaseAmount,
  unitLabelFor,
} from "@/lib/nutrition";
import type { FoodItem, MealType } from "@/lib/types";

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
  /** Meal picker (add-food flow only). */
  meal?: MealType | null;
  onMealChange?: (meal: MealType) => void;
}

/**
 * Product detail: large quantity stepper with unit selector, quick
 * servings, live nutrition and an optional meal picker. Nutrition
 * updates immediately on every change.
 */
export function FoodQuantity({
  food,
  amount,
  unitKey,
  onAmountChange,
  onUnitChange,
  onSubmit,
  meal = null,
  onMealChange,
}: FoodQuantityProps) {
  const parsed = parseAmountInput(amount);
  const valid = parsed !== null && parsed > 0;
  const nutrition =
    valid && parsed !== null ? nutritionForServing(food, parsed, unitKey) : null;
  const Icon = categoryIcon(food.category);
  const category = getCategory(food.category);
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
      {/* Product header */}
      <div className="flex items-center gap-3.5">
        {food.imageUrl ? (
          // External product photo (Open Food Facts); falls back to the
          // category icon when the image fails to load.
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={food.imageUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </span>
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight text-foreground">
            {food.name}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {category.name}
            {food.brand ? ` · ${food.brand}` : ""} ·{" "}
            {hasNutrition(food)
              ? `${formatNumber(food.calories ?? 0)} ккал / 100 ${baseUnitLabel(food)}`
              : "нет данных о КБЖУ"}
          </p>
          {food.type === "branded" && (
            <p className="mt-px truncate text-xs text-muted-foreground/80">
              Источник: {sourceLabelOf(food)}
            </p>
          )}
        </div>
      </div>

      {/* Quantity stepper */}
      <div className="mt-6 flex items-center justify-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => changeBy(-step)}
          aria-label="Уменьшить количество"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-foreground/[0.06] text-foreground transition-[background-color,transform] duration-150 hover:bg-foreground/10 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Minus className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <span
          className={cn(
            "flex h-14 items-stretch overflow-hidden rounded-2xl border border-transparent bg-foreground/[0.05] transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/10",
            !valid && "border-red-500/60",
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
            className="h-full w-24 bg-transparent px-2 text-center text-2xl font-bold tabular-nums tracking-tight text-foreground outline-none"
          />
          <span className="relative flex items-stretch">
            <select
              value={unitKey}
              onChange={(event) => handleUnitChange(event.target.value)}
              aria-label="Единица измерения"
              className="h-full cursor-pointer appearance-none border-l border-foreground/10 bg-transparent py-0 pl-2 pr-7 text-[15px] font-semibold text-foreground outline-none"
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
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25 transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>

      {/* Base-unit equivalent */}
      {valid && parsed !== null && !isBase && (
        <p className="mt-2.5 text-center text-[13px] tabular-nums text-muted-foreground">
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
                "h-9 rounded-full px-3.5 text-sm transition-[background-color,color,transform] duration-150 active:scale-95",
                active
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "bg-foreground/[0.06] font-medium text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
              )}
            >
              {formatServing(food, serving)}
            </button>
          );
        })}
      </div>

      {!valid && (
        <p
          className="mt-3 text-center text-[13px] font-medium text-red-600 dark:text-red-400"
          role="alert"
        >
          Введите количество больше 0
        </p>
      )}

      {/* Live nutrition preview */}
      <div className="mt-6 rounded-3xl bg-foreground/[0.03] px-4 py-5 text-center">
        <p className="text-[13px] font-medium text-muted-foreground">
          Пищевая ценность
          {valid && parsed !== null && (
            <span className="ml-1 text-muted-foreground/70">
              ({formatAmountInUnit(food, parsed, unitKey)})
            </span>
          )}
        </p>
        {hasNutrition(food) ? (
          <p className="mt-1 text-[34px] font-bold leading-none tabular-nums tracking-tight text-primary">
            {formatNumber(nutrition?.calories ?? 0)}
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">
              ккал
            </span>
          </p>
        ) : (
          <p className="mt-1 text-[15px] font-semibold text-muted-foreground">
            Нет данных о КБЖУ
          </p>
        )}
        {hasNutrition(food) && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Белки</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-protein">
              {formatNumber(nutrition?.protein ?? 0)} г
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Жиры</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-fat">
              {formatNumber(nutrition?.fat ?? 0)} г
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Углеводы</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-carbs">
              {formatNumber(nutrition?.carbs ?? 0)} г
            </p>
          </div>
        </div>
        )}
      </div>

      {/* Meal picker (add-food flow) */}
      {onMealChange && (
        <div className="mt-6">
          <p className="text-[13px] font-semibold text-muted-foreground">
            Приём пищи
          </p>
          <div
            className="mt-2 grid grid-cols-4 gap-1 rounded-2xl bg-foreground/[0.05] p-1"
            role="radiogroup"
            aria-label="Приём пищи"
          >
            {MEALS.map((mealOption) => {
              const active = meal === mealOption.id;
              return (
                <button
                  key={mealOption.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onMealChange(mealOption.id)}
                  className={cn(
                    "h-10 truncate rounded-xl px-1 text-[13px] transition-colors duration-150",
                    active
                      ? "bg-card font-semibold text-foreground shadow-sm"
                      : "font-medium text-muted-foreground hover:text-foreground",
                  )}
                >
                  {mealOption.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
