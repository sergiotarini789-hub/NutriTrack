"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { useDiary } from "@/lib/diary";
import { categoryIcon, getCategory } from "@/lib/food-data";
import { formatNumber } from "@/lib/format";
import { baseUnitLabel, formatServing, sourceLabelOf } from "@/lib/nutrition";
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
                <Button variant="danger" size="lg" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
              )}
              <Button
                size="lg"
                className="flex-1 rounded-full"
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
  const isUser = food.type === "user";
  const isBranded = food.type === "branded";
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [food.id]);
  const extraUnits = food.units.filter(
    (unit) => unit.key !== food.baseUnit,
  );

  return (
    <div>
      {/* Product header */}
      <div className="flex items-center gap-3.5">
        {food.imageUrl && !imageFailed ? (
          // External product photo (Open Food Facts).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.imageUrl}
            alt={food.name}
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-2xl object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight text-foreground">
            {food.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {category.name}
            </span>
            <span
              className={
                isUser || isBranded
                  ? "rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
                  : "rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {isUser
                ? "Ваш продукт"
                : isBranded
                  ? sourceLabelOf(food)
                  : "Справочное значение"}
            </span>
          </div>
        </div>
      </div>

      {/* Nutrition */}
      <div className="mt-5 rounded-3xl bg-foreground/[0.03] p-5 text-center">
        <p className="text-[13px] font-medium text-muted-foreground">
          Пищевая ценность на 100 {baseUnitLabel(food)}
        </p>
        <p className="mt-1 text-[34px] font-bold leading-none tabular-nums tracking-tight text-foreground">
          {formatNumber(food.calories)}
          <span className="ml-1.5 text-sm font-medium text-muted-foreground">
            ккал
          </span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Белки</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-protein">
              {formatNumber(food.protein)} г
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Жиры</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-fat">
              {formatNumber(food.fat)} г
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Углеводы</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-carbs">
              {formatNumber(food.carbs)} г
            </p>
          </div>
        </div>
      </div>

      {/* Servings */}
      {extraUnits.length > 0 && (
        <div className="mt-5">
          <p className="text-[13px] font-semibold text-muted-foreground">
            Порции
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {extraUnits.map((unit) => (
              <span
                key={unit.key}
                className="rounded-full bg-foreground/[0.06] px-3 py-1.5 text-[13px] font-medium tabular-nums text-foreground"
              >
                1 {unit.label} ≈ {formatNumber(unit.base)} {baseUnitLabel(food)}
              </span>
            ))}
          </div>
          {food.servingOptions.length > 0 && (
            <p className="mt-2.5 text-[13px] text-muted-foreground">
              Быстрый выбор:{" "}
              {food.servingOptions
                .slice(0, 4)
                .map((serving) => formatServing(food, serving))
                .join(", ")}
            </p>
          )}
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Источник: {sourceLabelOf(food)}.
        {food.brand && <> Бренд: {food.brand}.</>}
        {food.barcode && <> Штрихкод: {food.barcode}.</>}
        <> Значения носят справочный характер.</>
      </p>
    </div>
  );
}
