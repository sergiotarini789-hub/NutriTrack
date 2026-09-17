"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { useDiary } from "@/lib/diary";
import { categoryIcon, getCategory } from "@/lib/food-data";
import { formatNumber } from "@/lib/format";
import { baseUnitLabel, formatServing } from "@/lib/nutrition";
import { useRef, useState } from "react";
import type { FoodItem } from "@/lib/types";

interface FoodDetailsModalProps {
  food: FoodItem | null;
  onClose: () => void;
  onAddToDiary: (food: FoodItem) => void;
}

/** Food details: per-100 values, servings, source and diary shortcut. */
export function FoodDetailsModal({
  food,
  onClose,
  onAddToDiary,
}: FoodDetailsModalProps) {
  const { deleteUserFood } = useDiary();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDelete() {
    if (!food) return;
    deleteUserFood(food.id);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(`Продукт «${food.name}» удалён`);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
    onClose();
  }

  return (
    <>
      <Modal
        open={food !== null}
        onClose={onClose}
        title={food?.name ?? ""}
        footer={
          food ? (
            <div className="flex gap-3">
              {food.sourceType === "user" && (
                <Button variant="secondary" size="lg" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
              )}
              <Button
                size="lg"
                className="flex-1"
                onClick={() => onAddToDiary(food)}
              >
                Добавить в дневник
              </Button>
            </div>
          ) : undefined
        }
      >
        {food && <FoodDetails food={food} />}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

function FoodDetails({ food }: { food: FoodItem }) {
  const Icon = categoryIcon(food.category);
  const category = getCategory(food.category);
  const extraUnits = food.units.filter(
    (unit) => unit.key !== food.baseUnit,
  );

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">
            {food.name}
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {category.name}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">
            Пищевая ценность на 100 {baseUnitLabel(food)}
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Калории</span>
          <span className="text-xl font-bold tabular-nums text-foreground">
            {formatNumber(food.calories)}{" "}
            <span className="text-sm font-medium text-muted-foreground">ккал</span>
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Белки</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-protein">
              {formatNumber(food.protein)} г
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Жиры</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-fat">
              {formatNumber(food.fat)} г
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Углеводы</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-carbs">
              {formatNumber(food.carbs)} г
            </p>
          </div>
        </div>
      </div>

      {extraUnits.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border p-4">
          <p className="text-[13px] font-medium text-muted-foreground">
            Порции
          </p>
          <ul className="mt-2 space-y-1.5">
            {extraUnits.map((unit) => (
              <li
                key={unit.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">
                  1 {unit.label} ≈ {formatNumber(unit.base)} {baseUnitLabel(food)}
                </span>
              </li>
            ))}
            {food.servingOptions.length > 0 && (
              <li className="pt-1 text-[13px] text-muted-foreground">
                Быстрый выбор:{" "}
                {food.servingOptions
                  .slice(0, 4)
                  .map((serving) => formatServing(food, serving))
                  .join(", ")}
              </li>
            )}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {food.sourceName && <>Источник: {food.sourceName}. </>}
        Значения носят справочный характер.
      </p>
    </div>
  );
}
