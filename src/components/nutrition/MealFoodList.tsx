"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, MoreHorizontal, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDiary } from "@/lib/diary";
import { formatNumber } from "@/lib/format";
import {
  formatEntryAmount,
  getFoodUnit,
  hasNutrition,
  minForUnit,
  nutritionForServing,
  parseAmountInput,
  stepForUnit,
  unitLabelFor,
  type ResolvedEntry,
} from "@/lib/nutrition";
import { prefersReducedMotion } from "@/lib/motion";
import { EditEntryModal } from "./EditEntryModal";
import { Toast } from "@/components/ui/Toast";

interface MealFoodListProps {
  items: ResolvedEntry[];
}

/**
 * Meal entries (Stage 10): lightweight rows — name on the left,
 * calories on the right, quantity as quiet metadata that opens a
 * quick inline editor. Row actions (edit / repeat / delete) hide
 * behind a single "…" button instead of permanent icon clutter.
 */
export function MealFoodList({ items }: MealFoodListProps) {
  const { removeEntry, addEntry } = useDiary();
  const [editItem, setEditItem] = useState<ResolvedEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; detail: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(message: string, detail: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, detail });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function handleDeleted(item: ResolvedEntry) {
    removeEntry(item.entry.id);
    const kcal = nutritionForServing(
      item.food,
      item.entry.amount,
      item.entry.unit,
    ).calories;
    notify(
      "Удалено",
      hasNutrition(item.food)
        ? `${item.food.name} · −${formatNumber(Math.round(kcal))} ккал`
        : item.food.name,
    );
  }

  /** "Repeat" re-adds the same food, amount and unit to the same meal. */
  function handleRepeated(item: ResolvedEntry) {
    addEntry({
      foodId: item.food.id,
      mealType: item.entry.mealType,
      amount: item.entry.amount,
      unit: item.entry.unit,
    });
    notify("Добавлено", item.food.name);
  }

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  return (
    <>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <MealFoodRow
            key={item.entry.id}
            item={item}
            onEdit={setEditItem}
            onDeleted={handleDeleted}
            onRepeated={handleRepeated}
          />
        ))}
      </ul>
      <EditEntryModal item={editItem} onClose={() => setEditItem(null)} />
      <Toast message={toast?.message ?? null} detail={toast?.detail ?? null} />
    </>
  );
}

interface MealFoodRowProps {
  item: ResolvedEntry;
  onEdit: (item: ResolvedEntry | null) => void;
  /** Called after the exit animation finishes. */
  onDeleted: (item: ResolvedEntry) => void;
  onRepeated: (item: ResolvedEntry) => void;
}

function MealFoodRow({ item, onEdit, onDeleted, onRepeated }: MealFoodRowProps) {
  const [inlineOpen, setInlineOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { entry, food } = item;
  const nutrition = nutritionForServing(food, entry.amount, entry.unit);

  function handleDelete() {
    if (removing) return;
    if (prefersReducedMotion()) {
      onDeleted(item);
      return;
    }
    // Slide the row out first so the change is perceivable.
    setRemoving(true);
    window.setTimeout(() => onDeleted(item), 220);
  }

  return (
    <li
      className={cn(
        "animate-row-in rounded-2xl transition-colors hover:bg-foreground/[0.03]",
        removing && "animate-row-out pointer-events-none",
      )}
    >
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="min-w-0 flex-1">
          {/* Line 1: name + calories */}
          <div className="flex items-baseline justify-between gap-2">
            <p className="min-w-0 truncate text-[14.5px] font-medium text-foreground">
              {food.name}
            </p>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {hasNutrition(food) ? formatNumber(Math.round(nutrition.calories)) : "—"}
              {hasNutrition(food) && (
                <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                  ккал
                </span>
              )}
            </p>
          </div>

          {/* Line 2: quantity (tap to quick-edit) */}
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
              className="mt-px -ml-1.5 rounded-md px-1.5 py-1 text-[12.5px] tabular-nums text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {formatEntryAmount(food, entry.amount, entry.unit)}
            </button>
          )}
        </div>

        {/* Single quiet "…" reveals the contextual actions */}
        <button
          type="button"
          onClick={() => setActionsOpen((open) => !open)}
          aria-expanded={actionsOpen}
          aria-label={`Действия: ${food.name}`}
          title="Действия"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            actionsOpen
              ? "bg-foreground/[0.06] text-foreground"
              : "text-muted-foreground/70 hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {actionsOpen && (
        <div
          className="animate-step-in flex items-center gap-1 px-2 pb-2 motion-reduce:animate-none"
          role="group"
          aria-label={`Действия с «${food.name}»`}
        >
          <RowAction
            icon={<Pencil className="h-4 w-4" />}
            label="Изменить"
            ariaLabel={`Изменить: ${food.name}`}
            onClick={() => onEdit(item)}
          />
          <RowAction
            icon={<Repeat className="h-4 w-4" />}
            label="Повторить"
            ariaLabel={`Повторить: ${food.name}`}
            onClick={() => {
              setActionsOpen(false);
              onRepeated(item);
            }}
          />
          <RowAction
            icon={<Trash2 className="h-4 w-4" />}
            label="Удалить"
            ariaLabel={`Удалить: ${food.name}`}
            danger
            onClick={() => {
              setActionsOpen(false);
              handleDelete();
            }}
          />
        </div>
      )}
    </li>
  );
}

/** Quiet contextual action chip revealed by the row's "…" button. */
function RowAction({
  icon,
  label,
  ariaLabel,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  ariaLabel: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
        danger
          ? "text-red-600 hover:bg-red-500/10 dark:text-red-400 focus-visible:ring-red-500/40"
          : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-primary/40",
      )}
    >
      {icon}
      {label}
    </button>
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
        className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
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
        className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
