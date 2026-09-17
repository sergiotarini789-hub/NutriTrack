"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { MEALS, mealName } from "@/lib/app-data";
import { cn } from "@/lib/cn";
import { useDiary } from "@/lib/diary";
import { formatNumber } from "@/lib/format";
import { parseAmountInput } from "@/lib/nutrition";
import type { FoodItem, MealType } from "@/lib/types";
import { CustomFoodForm } from "./CustomFoodForm";
import { FoodQuantity } from "./FoodQuantity";
import { FoodSearch } from "./FoodSearch";

type Step = "meal" | "search" | "quantity" | "create";

interface AddFoodModalProps {
  open: boolean;
  onClose: () => void;
  /** Meal preset, e.g. when adding from a specific meal card. */
  preselectedMeal?: MealType | null;
  /** Food preset, e.g. "Добавить в дневник" from the products page. */
  preselectedFoodId?: string | null;
}

/**
 * Add-food flow: choose a meal, find a food (or create a custom one),
 * enter the amount, then add it to the diary.
 */
export function AddFoodModal({
  open,
  onClose,
  preselectedMeal = null,
  preselectedFoodId = null,
}: AddFoodModalProps) {
  const { addEntry, findFood } = useDiary();
  const [step, setStep] = useState<Step>("meal");
  const [meal, setMeal] = useState<MealType | null>(preselectedMeal);
  const [foodId, setFoodId] = useState<string | null>(preselectedFoodId);
  const [amount, setAmount] = useState("100");
  const [unitKey, setUnitKey] = useState("g");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const food: FoodItem | null = useMemo(
    () => (foodId ? (findFood(foodId) ?? null) : null),
    [foodId, findFood],
  );

  const parsedAmount = parseAmountInput(amount);
  const amountValid = parsedAmount !== null && parsedAmount > 0;
  const canAdd =
    step === "quantity" && meal !== null && food !== null && amountValid;

  // Reset the flow each time the modal opens. When a meal is preset
  // (quick add from a meal card), skip straight to food search; when a
  // food is preset (from the products page), start with meal selection.
  useEffect(() => {
    if (open) {
      setMeal(preselectedMeal);
      setFoodId(preselectedFoodId);
      applyDefaults(findFood(preselectedFoodId ?? "") ?? null);
      if (preselectedMeal && preselectedFoodId) {
        setStep("quantity");
      } else if (preselectedMeal) {
        setStep("search");
      } else {
        setStep("meal");
      }
    }
  }, [open, preselectedMeal, preselectedFoodId, findFood]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function applyDefaults(nextFood: FoodItem | null) {
    if (nextFood) {
      setAmount(formatNumber(nextFood.defaultServing.amount));
      setUnitKey(nextFood.defaultServing.unitKey);
    } else {
      setAmount("100");
      setUnitKey("g");
    }
  }

  function selectMeal(next: MealType) {
    setMeal(next);
    setStep(foodId ? "quantity" : "search");
  }

  function selectFood(next: FoodItem) {
    setFoodId(next.id);
    applyDefaults(next);
    setStep("quantity");
  }

  function handleCreated(next: FoodItem) {
    setFoodId(next.id);
    applyDefaults(next);
    setStep("quantity");
    showToast(`Продукт «${next.name}» создан`);
  }

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function goBack() {
    if (step === "quantity") {
      setStep(preselectedFoodId ? "meal" : "search");
    } else if (step === "search" || step === "create") {
      setStep("meal");
    }
  }

  function handleAdd() {
    if (!canAdd || !meal || !food || parsedAmount === null) return;
    addEntry({
      foodId: food.id,
      mealType: meal,
      amount: parsedAmount,
      unit: unitKey,
    });
    showToast(
      `Добавлено: ${food.name} · ${formatNumber(parsedAmount)} ${unitSuffix(food, parsedAmount, unitKey)} (${mealName(meal)})`,
    );
    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={step === "create" ? "Создать продукт" : "Добавить еду"}
        onBack={step !== "meal" ? goBack : undefined}
        footer={
          step === "quantity" ? (
            <Button
              size="lg"
              className="w-full"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              Добавить
            </Button>
          ) : undefined
        }
      >
        {step === "meal" && (
          <div>
            <p className="text-sm text-muted-foreground">Выберите приём пищи</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {MEALS.map((mealOption) => {
                const Icon = mealOption.icon;
                const selected = meal === mealOption.id;
                return (
                  <button
                    key={mealOption.id}
                    type="button"
                    onClick={() => selectMeal(mealOption.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition-colors sm:flex-row sm:gap-3 sm:px-5",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-foreground/[0.03]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "bg-foreground/5 text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[15px] font-medium text-foreground">
                      {mealOption.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "search" && (
          <FoodSearch onSelect={selectFood} onCreate={() => setStep("create")} />
        )}

        {step === "create" && <CustomFoodForm onCreated={handleCreated} />}

        {step === "quantity" &&
          (food ? (
            <FoodQuantity
              food={food}
              amount={amount}
              unitKey={unitKey}
              onAmountChange={setAmount}
              onUnitChange={setUnitKey}
              onSubmit={handleAdd}
            />
          ) : (
            <FoodSearch onSelect={selectFood} onCreate={() => setStep("create")} />
          ))}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/** Short unit label for the confirmation toast. */
function unitSuffix(
  food: FoodItem,
  amount: number,
  unitKey: string,
): string {
  const unit = food.units.find((candidate) => candidate.key === unitKey);
  if (!unit) return food.baseUnit;
  if (amount === 1) return unit.label;
  if (!Number.isInteger(amount)) return unit.few ?? unit.label;
  if (!unit.few || !unit.many) return unit.label;
  const mod10 = amount % 10;
  const mod100 = amount % 100;
  if (mod10 === 1 && mod100 !== 11) return unit.label;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return unit.few;
  return unit.many;
}
