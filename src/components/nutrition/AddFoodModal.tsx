"use client";

import { useEffect, useMemo, useRef, useState } from "react";import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { defaultMealForNow, mealName } from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import { formatNumber } from "@/lib/format";
import { nutritionForServing, parseAmountInput } from "@/lib/nutrition";
import type { FoodItem, MealType } from "@/lib/types";
import { BarcodeLookup } from "./BarcodeLookup";
import { CustomFoodForm } from "./CustomFoodForm";
import { FoodQuantity } from "./FoodQuantity";
import { FoodSearch } from "./FoodSearch";

type Step = "search" | "quantity" | "create";

/** Data carried into the manual creation flow (Stage 7). */
interface CreatePrefill {
  barcode: string;
  name?: string;
  brand?: string;
}

interface AddFoodModalProps {
  open: boolean;
  onClose: () => void;
  /** Meal preset, e.g. when adding from a specific meal section. */
  preselectedMeal?: MealType | null;
  /** Food preset, e.g. "Добавить в дневник" from the products page. */
  preselectedFoodId?: string | null;
}

/**
 * Add-food flow: search-first (with frequent shortcuts and
 * categories), a product-detail quantity step with the meal picker,
 * and custom-food creation. The meal defaults to the preset or to the
 * current time of day.
 */
export function AddFoodModal({
  open,
  onClose,
  preselectedMeal = null,
  preselectedFoodId = null,
}: AddFoodModalProps) {
  const { addEntry, findFood } = useDiary();
  const [step, setStep] = useState<Step>("search");
  const [meal, setMeal] = useState<MealType | null>(null);
  const [foodId, setFoodId] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [unitKey, setUnitKey] = useState("g");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [createPrefill, setCreatePrefill] = useState<CreatePrefill | null>(null);
  const [toast, setToast] = useState<{ message: string; detail?: string } | null>(
    null,
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const food: FoodItem | null = useMemo(
    () => (foodId ? (findFood(foodId) ?? null) : null),
    [foodId, findFood],
  );

  const parsedAmount = parseAmountInput(amount);
  const amountValid = parsedAmount !== null && parsedAmount > 0;
  const canAdd = step === "quantity" && meal !== null && food !== null && amountValid;

  // Reset the flow each time the modal OPENS. With a preset food the
  // flow starts at the quantity step; otherwise — at search.
  // Guarded by an open-transition ref: `findFood` changes identity
  // whenever products are created (new repository instance), and the
  // reset must not fire mid-flow — otherwise creating a product would
  // bounce the modal back to the search step.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setMeal(preselectedMeal ?? defaultMealForNow());
      setFoodId(preselectedFoodId);
      setSearchQuery("");
      setSearchCategory("all");
      setCreatePrefill(null);
      applyDefaults(findFood(preselectedFoodId ?? "") ?? null);
      setStep(preselectedFoodId ? "quantity" : "search");
    }
    wasOpenRef.current = open;
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

  function showToast(message: string, detail?: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, detail });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function goBack() {
    if (step === "quantity") {
      setStep(preselectedFoodId ? "search" : "search");
    } else if (step === "create") {
      setStep("search");
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
    const kcal = nutritionForServing(food, parsedAmount, unitKey).calories;
    showToast(
      "Добавлено",
      `${food.name} · +${formatNumber(kcal)} ккал · ${mealName(meal)}`,
    );
    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={step === "create" ? "Создать продукт" : "Добавить еду"}
        onBack={step !== "search" ? goBack : undefined}
        footer={
          step === "quantity" ? (
            <Button
              size="lg"
              className="w-full rounded-full"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              Добавить
            </Button>
          ) : undefined
        }
      >
        <div key={step} className="animate-step-in">
          {step === "search" && (
            <>
              <BarcodeLookup
                onFound={selectFood}
                onManualCreate={(prefill) => {
                  setCreatePrefill(prefill);
                  setStep("create");
                }}
              />
              <div className="mt-5 h-px bg-border" aria-hidden />
              <FoodSearch
                onSelect={selectFood}
                onCreate={() => setStep("create")}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                category={searchCategory}
                onCategoryChange={setSearchCategory}
              />
            </>
          )}

          {step === "create" && (
            <CustomFoodForm
              key={createPrefill?.barcode ?? "blank"}
              initialBarcode={createPrefill?.barcode}
              initialName={createPrefill?.name}
              initialBrand={createPrefill?.brand}
              onCreated={handleCreated}
            />
          )}

          {step === "quantity" &&
            (food ? (
              <FoodQuantity
                food={food}
                amount={amount}
                unitKey={unitKey}
                onAmountChange={setAmount}
                onUnitChange={setUnitKey}
                onSubmit={handleAdd}
                meal={meal}
                onMealChange={setMeal}
              />
            ) : (
              <FoodSearch
                onSelect={selectFood}
                onCreate={() => setStep("create")}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                category={searchCategory}
                onCategoryChange={setSearchCategory}
              />
            ))}
        </div>
      </Modal>
      <Toast message={toast?.message ?? null} detail={toast?.detail} />
    </>
  );
}

