import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { HistoryDayInfo } from "@/lib/types";

interface WeeklyOverviewProps {
  days: HistoryDayInfo[];
  /** Daily calorie target. */
  target: number;
}

/** Lightweight bar-chart overview of the last 7 days. */
export function WeeklyOverview({ days, target }: WeeklyOverviewProps) {
  const values = days
    .map((day) => day.calories)
    .filter((calories): calories is number => calories !== null);

  const chartMax = Math.ceil(Math.max(...values, target) * 1.08);
  const targetPercent = (target / chartMax) * 100;
  const daysWithData = values.length;
  const average =
    daysWithData > 0
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / daysWithData)
      : null;
  const inNormCount = values.filter((value) => value <= target).length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Обзор недели
        </h2>
        <span className="text-[13px] text-muted-foreground">
          последние 7 дней
        </span>
      </div>

      {/* Chart */}
      <div className="relative mt-6 h-40 sm:h-44">
        <div
          className="absolute inset-x-0 border-t border-dashed border-muted-foreground/40"
          style={{ bottom: `${targetPercent}%` }}
        >
          <span className="absolute right-0 top-0 -translate-y-full pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            норма
          </span>
        </div>

        <div className="flex h-full items-end gap-1.5 sm:gap-3">
          {days.map((day) => (
            <div
              key={day.dateKey}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span
                className={cn(
                  "text-[10px] font-semibold tabular-nums sm:text-xs",
                  day.calories === null
                    ? "text-muted-foreground/50"
                    : day.isToday
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                {day.calories === null ? "—" : formatNumber(day.calories)}
              </span>
              {day.calories === null ? (
                <div
                  className="w-full rounded-full bg-foreground/[0.07]"
                  style={{ height: "4px" }}
                />
              ) : (
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-[height] duration-500 ease-out motion-reduce:transition-none",
                    day.isToday ? "bg-primary" : "bg-primary/30",
                  )}
                  style={{ height: `${(day.calories / chartMax) * 100}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekday labels */}
      <div className="mt-2 flex gap-1.5 sm:gap-3">
        {days.map((day) => (
          <span
            key={day.dateKey}
            className={cn(
              "flex-1 text-center text-xs font-medium",
              day.isToday ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            {day.shortWeekday}
          </span>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 divide-x divide-border/70 border-t border-border/70 pt-5">
        <div className="pr-4">
          <p className="text-[13px] text-muted-foreground">Среднее за день</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-foreground">
            {average === null ? "—" : `${formatNumber(average)} ккал`}
          </p>
        </div>
        <div className="pl-4">
          <p className="text-[13px] text-muted-foreground">В норме</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-foreground">
            {daysWithData === 0
              ? "—"
              : `${inNormCount} из ${daysWithData} дней`}
          </p>
        </div>
      </div>
    </Card>
  );
}
