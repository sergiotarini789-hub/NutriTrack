"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDiary } from "@/lib/diary";
import { dateKey } from "@/lib/dates";
import { buildHistoryDays, weekDates, weekRangeLabel } from "@/lib/history";
import { HistoryDayCard } from "./HistoryDayCard";
import { HistoryDayDetail } from "./HistoryDayDetail";
import { WeeklyOverview } from "./WeeklyOverview";

/**
 * History screen (Stage 12): rolling 7-day windows with week
 * pagination (all stored entries stay reachable, never future dates),
 * a weekly overview with averages, and selectable days opening a
 * read-only "Сегодня, but read-only" detail. Everything is derived
 * from the diary on the fly — no new persistence.
 */
export function HistoryView() {
  const { ready, entries, targets, findFood } = useDiary();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const dates = useMemo(() => weekDates(weekOffset), [weekOffset]);
  const days = useMemo(
    () => buildHistoryDays(entries, findFood, dates),
    [entries, findFood, dates],
  );

  if (!ready) return <LoadingState />;

  const calorieTarget = targets?.calories ?? null;
  const hasAnyEntries = entries.length > 0;
  const atCurrentWeek = weekOffset === 0;

  /** Day navigation from the detail view; crossing a week boundary
   *  shifts the visible window so the selected day stays in context. */
  function handleDayChange(nextDayKey: string) {
    setSelectedDay(nextDayKey);
    const spanStart = dateKey(dates[0]);
    const spanEnd = dateKey(dates[dates.length - 1]);
    if (nextDayKey < spanStart) {
      setWeekOffset((offset) => offset + 1);
    } else if (nextDayKey > spanEnd) {
      setWeekOffset((offset) => Math.max(0, offset - 1));
    }
  }

  return (
    <>
      <PageHeader
        title="История"
        subtitle="Ваша динамика питания за последние дни"
      />

      {hasAnyEntries ? (
        <div className="space-y-5 sm:space-y-6">
          {/* Week pagination — older stored entries stay reachable,
              future weeks do not exist. */}
          <nav
            className="flex items-center justify-between gap-2"
            aria-label="Неделя"
          >
            <button
              type="button"
              onClick={() => setWeekOffset((offset) => offset + 1)}
              aria-label="Предыдущая неделя"
              className="flex h-11 items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-3"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Предыдущая неделя</span>
            </button>
            <p className="min-w-0 text-center text-[15px] font-semibold tabular-nums text-foreground">
              {weekRangeLabel(dates)}
            </p>
            <button
              type="button"
              onClick={() => setWeekOffset((offset) => Math.max(0, offset - 1))}
              aria-label="Следующая неделя"
              disabled={atCurrentWeek}
              className="flex h-11 items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-30 sm:px-3"
            >
              <span className="hidden sm:inline">Следующая неделя</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>

          <WeeklyOverview days={days} target={calorieTarget} />

          {/* Day list + open day detail (side by side on desktop) */}
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-8">
            <section
              aria-label="По дням"
              className={selectedDay ? "hidden lg:block" : "block"}
            >
              <h2 className="mb-3 text-base font-semibold text-foreground">
                По дням
              </h2>
              <Card className="divide-y divide-border/70">
                {[...days].reverse().map((day) => (
                  <HistoryDayCard
                    key={day.dateKey}
                    day={day}
                    target={calorieTarget}
                    onSelect={() => setSelectedDay(day.dateKey)}
                    selected={selectedDay === day.dateKey}
                  />
                ))}
              </Card>
            </section>

            {selectedDay && (
              <HistoryDayDetail
                dayKey={selectedDay}
                targets={targets}
                onDayChange={handleDayChange}
                onBackToList={() => setSelectedDay(null)}
              />
            )}
          </div>
        </div>
      ) : (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground">
            <CalendarDays className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] font-medium text-foreground">
            Пока нет данных
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Добавьте еду на странице «Сегодня», чтобы увидеть историю питания
          </p>
          <Link href="/today" className="mt-5">
            <Button variant="secondary">Перейти к «Сегодня»</Button>
          </Link>
        </Card>
      )}
    </>
  );
}
