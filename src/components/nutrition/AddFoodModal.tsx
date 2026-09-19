"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { defaultMealForNow, mealName } from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import { formatNumber } from "@/lib/format";
import {
  formatAmountInUnit,
  hasNutrition,
  nutritionForServing,
  parseAmountInput,
} from "@/lib/nutrition";
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
  /** Reopens the flow — used by the "Добавить ещё" toast action. */
  onReopen?: () => void;
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
  onReopen,
}: AddFoodModalProps) {
  const { addEntry, findFood, adoptOffProduct } = useDiary();
  const [step, setStep] = useState<Step>("search");
  const [meal, setMeal] = useState<MealType | null>(null);
  const [foodId, setFoodId] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [unitKey, setUnitKey] = useState("g");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [createPrefill, setCreatePrefill] = useState<CreatePrefill | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    detail?: string;
    action?: { label: string; onClick: () => void } | null;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  // Double-submission guard: one entry per add click, ever (Stage 11).
  const submitLockRef = useRef(false);

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
      submitLockRef.current = false;
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
    // Stage 8B: an OFF search result must be persisted into the local
    // OFF store BEFORE the entry is created, so the diary can resolve
    // it offline (same store the barcode flow uses; idempotent by id).
    if (next.type === "branded" && next.sourceType === "open_food_facts") {
      adoptOffProduct(next);
    }
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

  function showToast(
    message: string,
    detail?: string,
    action?: { label: string; onClick: () => void } | null,
  ) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, detail, action });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  function goBack() {
    if (step === "quantity") {
      setStep(preselectedFoodId ? "search" : "search");
    } else if (step === "create") {
      setStep("search");
    }
  }

  function handleAdd() {
    // Locked after the first tap until the sheet reopens — a double
    // click or a repeated Enter must not create a second entry.
    if (submitLockRef.current) return;
    if (!canAdd || !meal || !food || parsedAmount === null) return;
    submitLockRef.current = true;
    addEntry({
      foodId: food.id,
      mealType: meal,
      amount: parsedAmount,
      unit: unitKey,
    });
    const kcal = nutritionForServing(food, parsedAmount, unitKey).calories;
    const amountLabel = formatAmountInUnit(food, parsedAmount, unitKey);
    showToast(
      `Добавлено в ${mealName(meal).toLowerCase()}`,
      hasNutrition(food)
        ? `${food.name} · ${amountLabel} · ${formatNumber(Math.round(kcal))} ккал`
        : `${food.name} · ${amountLabel}`,
      onReopen
        ? {
            label: "Добавить ещё",
            onClick: () => {
              if (toastTimer.current) clearTimeout(toastTimer.current);
              setToast(null);
              onReopen();
            },
          }
        : null,
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
        size="lg"
        footer={
          step === "quantity" && meal ? (
            <Button
              size="lg"
              className="w-full rounded-full"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              Добавить в {mealName(meal).toLowerCase()}
            </Button>
          ) : undefined
        }
      >
        <div key={step} className="animate-step-in">
          {step === "search" && (
            <>
              {/* Search first — it is the primary path */}
              <FoodSearch
                onSelect={selectFood}
                onCreate={() => setStep("create")}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                category={searchCategory}
                onCategoryChange={setSearchCategory}
                searchInputRef={searchInputRef}
              />

              {/* The other two ways: barcode and creating a product */}
              <div className="mt-5">
                <div className="h-px bg-border" aria-hidden />
                <div className="mt-4 space-y-2">
                  <BarcodeLookup
                    onFound={selectFood}
                    onManualCreate={(prefill) => {
                      setCreatePrefill(prefill);
                      setStep("create");
                    }}
                    onSearchFocus={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                  />
                  <Button
                    variant="soft"
                    size="lg"
                    className="w-full justify-center rounded-2xl"
                    onClick={() => setStep("create")}
                  >
                    <Plus className="h-[18px] w-[18px]" />
                    Создать свой продукт
                  </Button>
                </div>
              </div>
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
                searchInputRef={searchInputRef}
              />
            ))}
        </div>
      </Modal>
      <Toast
        message={toast?.message ?? null}
        detail={toast?.detail}
        action={toast?.action ?? null}
      />
    </>
  );
}

