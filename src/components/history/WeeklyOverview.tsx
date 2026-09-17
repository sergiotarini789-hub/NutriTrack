import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { dailyTargets, historyDays } from "@/lib/mock-data";

/** Simple bar-chart overview of the last 7 days. */
export function WeeklyOverview() {
  const chartMax = Math.ceil(
    Math.max(
      ...historyDays.map((day) => day.calories),
      dailyTargets.calories,
    ) * 1.08,
  );
  const targetPercent = (dailyTargets.calories / chartMax) * 100;
  const average = Math.round(
    historyDays.reduce((sum, day) => sum + day.calories, 0) / historyDays.length,
  );
  const inNormCount = historyDays.filter(
    (day) => day.calories <= dailyTargets.calories,
  ).length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-foreground">Обзор недели</h2>
        <span className="text-sm text-muted-foreground">последние 7 дней</span>
      </div>

      {/* Chart */}
      <div className="relative mt-6 h-44 sm:h-48">
        <div
          className="absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
          style={{ bottom: `${targetPercent}%` }}
        >
          <span className="absolute right-0 top-0 -translate-y-full pb-1 text-[10px] font-medium text-muted-foreground">
            норма
          </span>
        </div>

        <div className="flex h-full items-end gap-1.5 sm:gap-3">
          {historyDays.map((day) => (
            <div
              key={day.id}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span
                className={cn(
                  "text-[10px] font-medium tabular-nums sm:text-xs",
                  day.isToday ? "text-primary" : "text-muted-foreground",
                )}
              >
                {formatNumber(day.calories)}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md",
                  day.isToday ? "bg-primary" : "bg-primary/30",
                )}
                style={{ height: `${(day.calories / chartMax) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weekday labels */}
      <div className="mt-2 flex gap-1.5 sm:gap-3">
        {historyDays.map((day) => (
          <span
            key={day.id}
            className={cn(
              "flex-1 text-center text-xs",
              day.isToday
                ? "font-semibold text-primary"
                : "text-muted-foreground",
            )}
          >
            {day.shortWeekday}
          </span>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 divide-x divide-border border-t border-border pt-5">
        <div className="pr-4">
          <p className="text-[13px] text-muted-foreground">Среднее за день</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {formatNumber(average)} ккал
          </p>
        </div>
        <div className="pl-4">
          <p className="text-[13px] text-muted-foreground">В норме</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {inNormCount} из {historyDays.length} дней
          </p>
        </div>
      </div>
    </Card>
  );
}
