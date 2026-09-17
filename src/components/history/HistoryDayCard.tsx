import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatNumber } from "@/lib/format";
import type { HistoryDayInfo } from "@/lib/types";

interface HistoryDayCardProps {
  day: HistoryDayInfo;
  /** Daily calorie target. */
  target: number;
}

/**
 * One row in the "По дням" timeline: date, weekday, calories, macro
 * totals and progress against the daily norm.
 */
export function HistoryDayCard({ day, target }: HistoryDayCardProps) {
  if (day.calories === null) {
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-medium text-foreground">{day.label}</p>
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
        <p className="shrink-0 text-[13px] text-muted-foreground/70">Нет данных</p>
      </div>
    );
  }

  const over = day.calories > target;
  const diff = day.calories - target;

  return (
    <div className="px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-medium text-foreground">{day.label}</p>
            {day.isToday && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Сегодня
              </span>
            )}
            {over && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-red-600 dark:text-red-400">
                +{formatNumber(diff)} ккал
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
        Б {formatNumber(day.protein ?? 0)} · Ж {formatNumber(day.fat ?? 0)} · У{" "}
        {formatNumber(day.carbs ?? 0)} г
      </p>

      <div className="mt-2.5">
        <ProgressBar
          value={day.calories}
          max={target}
          color={over ? "danger" : "primary"}
        />
      </div>
    </div>
  );
}
