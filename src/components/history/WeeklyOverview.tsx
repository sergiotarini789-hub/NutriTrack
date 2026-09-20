import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { dayAverages, inNormCount } from "@/lib/history";
import type { HistoryDayInfo } from "@/lib/types";

interface WeeklyOverviewProps {
  days: HistoryDayInfo[];
  /** Daily calorie target; null while no automatic target exists. */
  target: number | null;
}

/** Lightweight bar-chart overview of the last 7 days. */
export function WeeklyOverview({ days, target }: WeeklyOverviewProps) {
  const values = days
    .map((day) => day.calories)
    .filter((calories): calories is number => calories !== null);

  const chartMax = Math.max(
    1,
    Math.ceil(Math.max(...values, target ?? 0) * 1.08),
  );
  // Averages (calories AND macros) include only days with data.
  const averages = dayAverages(days);
  const inNorm = inNormCount(days, target);

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
      {target !== null && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          Сравнение с текущей нормой
        </p>
      )}

      {/* Chart */}
      <div className="relative mt-6 h-40 sm:h-44">
        {target !== null && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-muted-foreground/40"
            style={{ bottom: `${(target / chartMax) * 100}%` }}
          >
            <span className="absolute right-0 top-0 -translate-y-full pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              норма
            </span>
          </div>
        )}

        <div className="flex h-full items-end gap-1.5 sm:gap-3">
          {days.map((day) => {
            const overNorm =
              day.calories !== null &&
              target !== null &&
              day.calories > target;
            return (
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
                    overNorm
                      ? day.isToday
                        ? "bg-red-500"
                        : "bg-red-500/40"
                      : day.isToday
                        ? "bg-primary"
                        : "bg-primary/30",
                  )}
                  style={{ height: `${(day.calories / chartMax) * 100}%` }}
                />
              )}
            </div>
            );
          })}
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

      {/* Summary: averages over days WITH data, never counting empty days */}
      <div className="mt-6 grid grid-cols-2 divide-x divide-border/70 border-t border-border/70 pt-5">
        <div className="pr-4">
          <p className="text-[13px] text-muted-foreground">Среднее за день</p>
          {averages === null ? (
            <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-foreground">
              —
            </p>
          ) : (
            <>
              <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-foreground">
                {formatNumber(averages.calories)}{" "}
                <span className="text-[13px] font-medium text-muted-foreground">
                  ккал
                </span>
              </p>
              <p className="mt-0.5 text-[13px] tabular-nums text-muted-foreground">
                Б {formatNumber(averages.protein)} · Ж{" "}
                {formatNumber(averages.fat)} · У {formatNumber(averages.carbs)}{" "}
                г
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                по {averages.daysWithData}{" "}
                {averages.daysWithData === 1
                  ? "дню"
                  : averages.daysWithData < 5
                    ? "дням"
                    : "дням"}{" "}
                с записями
              </p>
            </>
          )}
        </div>
        <div className="pl-4">
          <p className="text-[13px] text-muted-foreground">В норме</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-foreground">
            {inNorm === null
              ? "—"
              : `${inNorm.count} из ${inNorm.daysWithData} дней`}
          </p>
        </div>
      </div>
    </Card>
  );
}
