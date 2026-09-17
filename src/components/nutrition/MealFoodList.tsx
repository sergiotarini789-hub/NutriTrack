"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDiary } from "@/lib/diary";
import { categoryIcon } from "@/lib/food-data";
import { formatNumber } from "@/lib/format";
import {
  formatEntryAmount,
  getFoodUnit,
  minForUnit,
  nutritionForServing,
  parseAmountInput,
  stepForUnit,
  unitLabelFor,
  type ResolvedEntry,
} from "@/lib/nutrition";
import { EditEntryModal } from "./EditEntryModal";

interface MealFoodListProps {
  items: ResolvedEntry[];
}

/** Compact food rows with quick amount edit, full edit and delete. */
export function MealFoodList({ items }: MealFoodListProps) {
  const [editItem, setEditItem] = useState<ResolvedEntry | null>(null);

  return (
    <>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <MealFoodRow key={item.entry.id} item={item} onEdit={setEditItem} />
        ))}
      </ul>
      <EditEntryModal item={editItem} onClose={() => setEditItem(null)} />
    </>
  );
}

interface MealFoodRowProps {
  item: ResolvedEntry;
  onEdit: (item: ResolvedEntry | null) => void;
}

function MealFoodRow({ item, onEdit }: MealFoodRowProps) {
  const { removeEntry } = useDiary();
  const [inlineOpen, setInlineOpen] = useState(false);
  const { entry, food } = item;
  const nutrition = nutritionForServing(food, entry.amount, entry.unit);
  const FoodIcon = categoryIcon(food.category);

  return (
    <li className="group flex items-center gap-2.5 rounded-2xl px-1 py-2 transition-colors hover:bg-foreground/[0.03]">
      {/* Food category visual */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.05] text-muted-foreground">
        <FoodIcon className="h-[17px] w-[17px]" />
      </span>

      <div className="min-w-0 flex-1">
        {/* Line 1: name + calories */}
        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-foreground">
            {food.name}
          </p>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {formatNumber(nutrition.calories)}
            <span className="ml-1 text-[11px] font-medium text-muted-foreground">
              ккал
            </span>
          </p>
        </div>

        {/* Line 2: quantity (click to quick-edit) */}
        {inlineOpen ? (
          <InlineAmountEditor
            item={item}
            onDone={() => setInlineOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setInlineOpen(true)}
            title="Изменить количество"
            className="mt-px -ml-1 rounded-md px-1 py-0.5 text-xs tabular-nums text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {formatEntryAmount(food, entry.amount, entry.unit)}
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => onEdit(item)}
          aria-label={`Изменить: ${food.name}`}
          title="Изменить"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => removeEntry(entry.id)}
          aria-label={`Удалить: ${food.name}`}
          title="Удалить"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

/** Compact [-] value [+] editor shown in place of the amount label. */
function InlineAmountEditor({
  item,
  onDone,
}: {
  item: ResolvedEntry;
  onDone: () => void;
}) {
  const { updateEntry } = useDiary();
  const { entry, food } = item;
  const [text, setText] = useState(formatNumber(entry.amount));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const step = stepForUnit(entry.unit, food);
  const min = minForUnit(entry.unit, food);
  const unit = getFoodUnit(food, entry.unit);

  function commitAmount(value: number) {
    updateEntry(entry.id, { amount: value, unit: entry.unit });
  }

  function changeBy(delta: number) {
    const parsed = parseAmountInput(text);
    const base = parsed !== null && parsed > 0 ? parsed : entry.amount;
    const next = Math.max(min, Math.round((base + delta) * 100) / 100);
    setText(formatNumber(next));
    commitAmount(next);
  }

  function commitText() {
    const parsed = parseAmountInput(text);
    if (parsed !== null && parsed > 0) {
      commitAmount(parsed);
    } else {
      setText(formatNumber(entry.amount));
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitText();
      onDone();
    } else if (event.key === "Escape") {
      onDone();
    }
  }

  return (
    <span className="mt-0.5 flex items-center gap-1">
      <button
        type="button"
        onClick={() => changeBy(-step)}
        aria-label="Уменьшить количество"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground active:scale-90"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={text}
        aria-label="Количество"
        onChange={(event) => setText(event.target.value)}
        onBlur={commitText}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-7 w-16 rounded-full bg-foreground/[0.06] px-1.5 text-center text-xs font-semibold tabular-nums text-foreground outline-none transition-[background-color,box-shadow] focus:bg-card focus:ring-2 focus:ring-primary/30",
        )}
      />
      <span className="text-xs text-muted-foreground">
        {unitLabelFor(unit, parseAmountInput(text) ?? entry.amount)}
      </span>
      <button
        type="button"
        onClick={() => changeBy(step)}
        aria-label="Увеличить количество"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground active:scale-90"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
