"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { MEALS, mealName } from "@/lib/app-data";
import { cn } from "@/lib/cn";
import { useDiary } from "@/lib/diary";
import { getFoodById } from "@/lib/food-data";
import { formatNumber } from "@/lib/format";
import { parseAmountInput } from "@/lib/nutrition";
import type { FoodItem, MealType } from "@/lib/types";
import { FoodQuantity } from "./FoodQuantity";
import { FoodSearch } from "./FoodSearch";

type Step = "meal" | "search" | "quantity";

const DEFAULT_AMOUNT = "100";

interface AddFoodModalProps {
  open: boolean;
  onClose: () => void;
  /** Meal preset, e.g. when adding from a specific meal card. */
  preselectedMeal?: MealType | null;
  /** Food preset, e.g. "Добавить в дневник" from the products page. */
  preselectedFoodId?: string | null;
}

/**
 * Add-food flow: choose a meal, find a food, enter the amount,
 * then add it to the diary.
 */
export function AddFoodModal({
  open,
  onClose,
  preselectedMeal = null,
  preselectedFoodId = null,
}: AddFoodModalProps) {
  const { addEntry } = useDiary();
  const [step, setStep] = useState<Step>("meal");
  const [meal, setMeal] = useState<MealType | null>(preselectedMeal);
  const [foodId, setFoodId] = useState<string | null>(preselectedFoodId);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const food: FoodItem | null = useMemo(
    () => (foodId ? (getFoodById(foodId) ?? null) : null),
    [foodId],
  );

  const parsedAmount = parseAmountInput(amount);
  const amountValid = parsedAmount !== null && parsedAmount > 0;
  const canAdd = step === "quantity" && meal !== null && food !== null && amountValid;

  // Reset the flow each time the modal opens. When a meal is preset
  // (quick add from a meal card), skip straight to food search.
  useEffect(() => {
    if (open) {
      setMeal(preselectedMeal);
      setFoodId(preselectedFoodId);
      setAmount(DEFAULT_AMOUNT);
      if (preselectedMeal && preselectedFoodId) {
        setStep("quantity");
      } else if (preselectedMeal) {
        setStep("search");
      } else {
        setStep("meal");
      }
    }
  }, [open, preselectedMeal, preselectedFoodId]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function selectMeal(next: MealType) {
    setMeal(next);
    setStep(foodId ? "quantity" : "search");
  }

  function selectFood(next: FoodItem) {
    setFoodId(next.id);
    setAmount(DEFAULT_AMOUNT);
    setStep("quantity");
  }

  function goBack() {
    if (step === "quantity") {
      setStep(preselectedFoodId ? "meal" : "search");
    } else if (step === "search") {
      setStep("meal");
    }
  }

  function handleAdd() {
    if (!canAdd || !meal || !food || parsedAmount === null) return;
    addEntry({ foodId: food.id, mealType: meal, amount: parsedAmount });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(
      `Добавлено: ${food.name} · ${formatNumber(parsedAmount)} г (${mealName(meal)})`,
    );
    toastTimer.current = setTimeout(() => setToast(null), 2500);
    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Добавить еду"
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

        {step === "search" && <FoodSearch onSelect={selectFood} />}

        {step === "quantity" &&
          (food ? (
            <FoodQuantity
              food={food}
              amount={amount}
              onAmountChange={setAmount}
              onSubmit={handleAdd}
            />
          ) : (
            <FoodSearch onSelect={selectFood} />
          ))}
      </Modal>
      <Toast message={toast} />
    </>
  );
}
