"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { useDiary } from "@/lib/diary";
import { parseAmountInput } from "@/lib/nutrition";
import { normalizeBarcode } from "@/lib/barcode";
import type { FoodItem, UserProduct } from "@/lib/types";

interface CustomFoodFormProps {
  /** Called with the created food (create mode). */
  onCreated?: (food: FoodItem) => void;
  /**
   * Product to edit (Stage 13A). When provided, the form switches to
   * update mode: fields are prefilled from the product and the submit
   * uses updateUserFood instead of creating a new product.
   */
  product?: UserProduct | null;
  /** Called with the updated product; falls back to onCreated. */
  onUpdated?: (food: FoodItem) => void;
  /** Prefill from a barcode lookup that found no usable product. */
  initialBarcode?: string;
  initialName?: string;
  initialBrand?: string;
}

/**
 * Form for creating (or, with `product`, editing) a custom product.
 * Values are per 100 g / 100 ml; an optional portion size adds a
 * "порция" serving unit. Can be prefilled when the user arrives from
 * an unsuccessful barcode lookup.
 */
export function CustomFoodForm({
  onCreated,
  product = null,
  onUpdated,
  initialBarcode,
  initialName,
  initialBrand,
}: CustomFoodFormProps) {
  const { addUserFood, updateUserFood } = useDiary();
  const editing = product !== null;
  const [name, setName] = useState(product?.name ?? initialName ?? "");
  const [baseUnit, setBaseUnit] = useState<"g" | "ml">(product?.baseUnit ?? "g");
  const [calories, setCalories] = useState(
    product?.calories !== undefined ? String(product.calories) : "",
  );
  const [protein, setProtein] = useState(
    product?.protein !== undefined ? String(product.protein) : "",
  );
  const [fat, setFat] = useState(
    product?.fat !== undefined ? String(product.fat) : "",
  );
  const [carbs, setCarbs] = useState(
    product?.carbs !== undefined ? String(product.carbs) : "",
  );
  // The portion size lives as the base of the "порция" unit.
  const [portion, setPortion] = useState(() => {
    const servingUnit = product?.units.find((unit) => unit.kind === "serving");
    return servingUnit ? String(servingUnit.base) : "";
  });
  const [brand, setBrand] = useState(product?.brand ?? initialBrand ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? initialBarcode ?? "");
  const [isBranded, setIsBranded] = useState(
    product ? product.isBranded : Boolean(initialBrand),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Введите название";
    const parsedCalories = parseAmountInput(calories);
    if (parsedCalories === null || parsedCalories <= 0) {
      next.calories = "Введите число больше 0";
    }
    for (const [field, value] of [
      ["protein", protein],
      ["fat", fat],
      ["carbs", carbs],
    ] as const) {
      if (value.trim() === "") continue;
      const parsed = parseAmountInput(value);
      if (parsed === null || parsed < 0) {
        next[field] = "Введите число 0 или больше";
      }
    }
    if (portion.trim() !== "") {
      const parsed = parseAmountInput(portion);
      if (parsed === null || parsed <= 0) {
        next.portion = "Введите число больше 0";
      }
    }
    if (barcode.trim() !== "" && !normalizeBarcode(barcode)) {
      next.barcode = "Штрихкод должен состоять из цифр";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setTouched(true);
    if (!validate()) return;

    // Edit mode: update the existing product through the same diary
    // API the details modal would use; storage semantics unchanged.
    if (editing && product) {
      const updated = updateUserFood(product.id, {
        name,
        calories: parseAmountInput(calories) ?? 0,
        protein: parseAmountInput(protein) ?? 0,
        fat: parseAmountInput(fat) ?? 0,
        carbs: parseAmountInput(carbs) ?? 0,
        baseUnit,
        portionSize: parseAmountInput(portion),
        isBranded,
        brand,
        barcode,
      });
      if (updated) (onUpdated ?? onCreated)?.(updated);
      return;
    }

    const food = addUserFood({
      name,
      calories: parseAmountInput(calories) ?? 0,
      protein: parseAmountInput(protein) ?? 0,
      fat: parseAmountInput(fat) ?? 0,
      carbs: parseAmountInput(carbs) ?? 0,
      baseUnit,
      portionSize: parseAmountInput(portion),
      isBranded,
      brand,
      barcode,
    });

    // Reset the form.
    setName("");
    setBaseUnit("g");
    setCalories("");
    setProtein("");
    setFat("");
    setCarbs("");
    setPortion("");
    setBrand("");
    setBarcode("");
    setIsBranded(false);
    setErrors({});
    setTouched(false);

    onCreated?.(food);
  }

  return (
    <div className="space-y-4">
      <Input
        label="Название"
        placeholder="Например, Мой творог"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={touched ? errors.name ?? null : null}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">
          Единица измерения
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "g", label: "граммы (г)" },
              { value: "ml", label: "миллилитры (мл)" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={baseUnit === option.value}
              onClick={() => setBaseUnit(option.value)}
              className={cn(
                "h-11 rounded-xl text-sm font-semibold transition-[background-color,color] duration-150 active:scale-[0.98]",
                baseUnit === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Калории"
          unit="ккал"
          placeholder="Например, 120"
          inputMode="decimal"
          value={calories}
          onChange={(event) => setCalories(event.target.value)}
          error={touched ? errors.calories ?? null : null}
        />
        <Input
          label="Белки"
          unit="г"
          placeholder="0"
          inputMode="decimal"
          value={protein}
          onChange={(event) => setProtein(event.target.value)}
          error={touched ? errors.protein ?? null : null}
        />
        <Input
          label="Жиры"
          unit="г"
          placeholder="0"
          inputMode="decimal"
          value={fat}
          onChange={(event) => setFat(event.target.value)}
          error={touched ? errors.fat ?? null : null}
        />
        <Input
          label="Углеводы"
          unit="г"
          placeholder="0"
          inputMode="decimal"
          value={carbs}
          onChange={(event) => setCarbs(event.target.value)}
          error={touched ? errors.carbs ?? null : null}
        />
      </div>

      <p className="text-[13px] text-muted-foreground">
        Значения указываются на 100 {baseUnit}
      </p>

      <Input
        label="Размер порции (необязательно)"
        unit={baseUnit}
        placeholder="Например, 150"
        inputMode="decimal"
        value={portion}
        onChange={(event) => setPortion(event.target.value)}
        error={touched ? errors.portion ?? null : null}
      />

      <Input
        label="Бренд (необязательно)"
        placeholder="Например, Домик в деревне"
        value={brand}
        maxLength={80}
        onChange={(event) => setBrand(event.target.value)}
      />

      <Input
        label="Штрихкод (необязательно)"
        placeholder="Например, 4601234567891"
        value={barcode}
        inputMode="numeric"
        onChange={(event) => setBarcode(event.target.value)}
        error={touched ? errors.barcode ?? null : null}
      />

      <label className="flex cursor-pointer items-center gap-2.5 select-none">
        <input
          type="checkbox"
          checked={isBranded}
          onChange={(event) => setIsBranded(event.target.checked)}
          className="h-4 w-4 rounded accent-[var(--primary)]"
        />
        <span className="text-sm text-foreground">Это брендовый продукт</span>
      </label>

      {editing && (
        <p className="text-[13px] leading-relaxed text-muted-foreground" role="note">
          Записи в дневнике пересчитаются по новым значениям.
        </p>
      )}

      <Button size="lg" className="w-full" onClick={handleSubmit}>
        {editing ? "Сохранить" : "Создать продукт"}
      </Button>
    </div>
  );
}
