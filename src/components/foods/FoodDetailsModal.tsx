"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatNumber } from "@/lib/format";
import type { FoodItem } from "@/lib/types";

interface FoodDetailsModalProps {
  food: FoodItem | null;
  onClose: () => void;
  onAddToDiary: (food: FoodItem) => void;
}

/** Food details with per-100 g nutrition and an "add to diary" action. */
export function FoodDetailsModal({
  food,
  onClose,
  onAddToDiary,
}: FoodDetailsModalProps) {
  return (
    <Modal
      open={food !== null}
      onClose={onClose}
      title={food?.name ?? ""}
      footer={
        food ? (
          <Button size="lg" className="w-full" onClick={() => onAddToDiary(food)}>
            Добавить в дневник
          </Button>
        ) : undefined
      }
    >
      {food && <FoodDetails food={food} />}
    </Modal>
  );
}

function FoodDetails({ food }: { food: FoodItem }) {
  const Icon = food.icon;

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
            Пищевая ценность на 100 г
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border p-4">
        <div className="flex items-baseline justify-between">
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
    </div>
  );
}
