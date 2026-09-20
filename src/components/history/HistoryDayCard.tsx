import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { HistoryDayInfo } from "@/lib/types";

interface HistoryDayCardProps {
  day: HistoryDayInfo;
  /** Daily calorie target; null while no target exists. */
  target: number | null;
  /** Opens this day's details (Stage 12). */
  onSelect: () => void;
  /** Whether this day is currently open. */
  selected: boolean;
}

/**
 * One selectable row in the "По дням" timeline (Stage 12): date,
 * weekday, whole-kcal calories, macro totals and progress against the
 * current norm. The whole row is a semantic button.
 */
export function HistoryDayCard({
  day,
  target,
  onSelect,
  selected,
}: HistoryDayCardProps) {
  const dayLabel = `${day.label}, ${day.weekdayLabel}${
    day.isToday ? ", сегодня" : ""
  }`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "date" : undefined}
      aria-label={`Открыть день: ${dayLabel}`}
      data-date-key={day.dateKey}
      className={cn(
        "w-full px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 sm:px-6",
        selected
          ? "bg-primary/[0.06]"
          : "hover:bg-foreground/[0.03]",
      )}
    >
      {day.calories === null ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-medium text-foreground">
                {day.label}
              </p>
              {day.isToday && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Сегодня
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {day.weekdayLabel}
            </p>
          </div>
          <p className="shrink-0 text-[13px] text-muted-foreground/70">
            Нет данных
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-medium text-foreground">
                  {day.label}
                </p>
                {day.isToday && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Сегодня
                  </span>
                )}
                {target !== null && day.calories > target && (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-red-600 dark:text-red-400">
                    +{formatNumber(day.calories - target)} ккал
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {day.weekdayLabel}
              </p>
            </div>

            <p className="shrink-0 text-right">
              <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                {formatNumber(day.calories)}
              </span>{" "}
              <span className="text-[13px] text-muted-foreground">ккал</span>
            </p>
          </div>

          <p className="mt-1 text-[13px] tabular-nums text-muted-foreground">
            Б {formatNumber(day.protein ?? 0)} · Ж {formatNumber(day.fat ?? 0)} ·
            У {formatNumber(day.carbs ?? 0)} г
          </p>

          {target !== null && (
            <div className="mt-2.5">
              <ProgressBar
                value={day.calories}
                max={target}
                color={day.calories > target ? "danger" : "primary"}
              />
            </div>
          )}
        </div>
      )}
    </button>
  );
}
