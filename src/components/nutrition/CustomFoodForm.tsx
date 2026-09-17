"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { useDiary } from "@/lib/diary";
import { parseAmountInput } from "@/lib/nutrition";
import type { FoodItem } from "@/lib/types";

interface CustomFoodFormProps {
  /** Called with the created food. */
  onCreated: (food: FoodItem) => void;
}

/**
 * Form for creating a custom product. Values are per 100 g / 100 ml;
 * an optional portion size adds a "порция" serving unit.
 */
export function CustomFoodForm({ onCreated }: CustomFoodFormProps) {
  const { addUserFood } = useDiary();
  const [name, setName] = useState("");
  const [baseUnit, setBaseUnit] = useState<"g" | "ml">("g");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [portion, setPortion] = useState("");
  const [isBranded, setIsBranded] = useState(false);
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
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setTouched(true);
    if (!validate()) return;

    const food = addUserFood({
      name,
      calories: parseAmountInput(calories) ?? 0,
      protein: parseAmountInput(protein) ?? 0,
      fat: parseAmountInput(fat) ?? 0,
      carbs: parseAmountInput(carbs) ?? 0,
      baseUnit,
      portionSize: parseAmountInput(portion),
      isBranded,
    });

    // Reset the form.
    setName("");
    setBaseUnit("g");
    setCalories("");
    setProtein("");
    setFat("");
    setCarbs("");
    setPortion("");
    setIsBranded(false);
    setErrors({});
    setTouched(false);

    onCreated(food);
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

      <label className="flex cursor-pointer items-center gap-2.5 select-none">
        <input
          type="checkbox"
          checked={isBranded}
          onChange={(event) => setIsBranded(event.target.checked)}
          className="h-4 w-4 rounded accent-[var(--primary)]"
        />
        <span className="text-sm text-foreground">Это брендовый продукт</span>
      </label>

      <Button size="lg" className="w-full" onClick={handleSubmit}>
        Создать продукт
      </Button>
    </div>
  );
}
