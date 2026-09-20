"use client";

import Link from "next/link";
import { Calculator } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import { useCountUp, useMountedForAnimation } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type {
  NutritionSummary,
  NutritionTargets,
} from "@/lib/types";

interface TodaySummaryProps {
  totals: NutritionSummary;
  /** Effective daily targets; null while the profile is incomplete. */
  targets: NutritionTargets | null;
  /**
   * Show the "fill your profile" hint when targets are null (default,
   * Today screen). History passes false: a day without a target still
   * shows its numbers — comparison is simply omitted.
   */
  profileHint?: boolean;
}

/** Macro descriptor for the compact strip. */
const MACROS = [
  { key: "protein", short: "Б", label: "Белки", color: "bg-protein" },
  { key: "fat", short: "Ж", label: "Жиры", color: "bg-fat" },
  { key: "carbs", short: "У", label: "Углеводы", color: "bg-carbs" },
] as const;

/**
 * Today's nutrition summary (Stage 10): a compact, editorial block
 * resting directly on the page background — the consumed amount as the
 * hero number, the target and the remaining amount right beside it, a
 * thin progress ring, and macro lines with hairline bars. No KPI
 * cards, no card-in-card, no oversized analytics chart.
 */
export function TodaySummary({
  totals,
  targets,
  profileHint = true,
}: TodaySummaryProps) {
  const animated = useMountedForAnimation();
  const display = useCountUp(totals.calories, 600);

  // No target and no hint requested (history): numbers only, never an
  // invented target and never a profile call-to-action.
  if (!targets && !profileHint) {
    return (
      <div>
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[34px] font-semibold leading-none tabular-nums tracking-tight text-foreground sm:text-[38px]">
            {formatNumber(Math.round(display))}
          </span>
          <span className="text-[15px] text-muted-foreground">ккал</span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          {MACROS.map((macro) => (
            <p
              key={macro.key}
              className="flex items-baseline gap-1.5 text-[12px] text-muted-foreground"
              aria-label={`${macro.label}: ${formatNumber(Math.round(totals[macro.key]))} г`}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 self-center rounded-full",
                  macro.color,
                )}
              />
              <span className="font-medium">{macro.short}</span>
              <span className="ml-auto truncate tabular-nums">
                <span className="font-semibold text-foreground">
                  {formatNumber(Math.round(totals[macro.key]))}
                </span>{" "}
                г
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }

  // Incomplete profile: no invented target — ask for the profile.
  if (!targets) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Calculator className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-foreground">
              Заполните параметры профиля
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
              Чтобы рассчитать вашу дневную норму калорий.
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-colors hover:bg-primary-hover"
          >
            Заполнить профиль
          </Link>
        </div>
      </Card>
    );
  }

  // Round for display: legible tabular numbers, no decimal noise.
  const remaining = Math.round(targets.calories - totals.calories);
  const over = remaining < 0;

  return (
    <div className="flex items-center gap-5 sm:gap-7">
      {/* Numbers: consumed is the hero, target and remaining follow */}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[34px] font-semibold leading-none tabular-nums tracking-tight text-foreground sm:text-[38px]">
            {formatNumber(Math.round(display))}
          </span>
          <span className="text-[15px] tabular-nums text-muted-foreground">
            из {formatNumber(targets.calories)} ккал
          </span>
        </p>
        <p
          className={cn(
            "mt-2.5 inline-flex rounded-full px-3 py-1 text-[13px] font-medium tabular-nums",
            over
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : "bg-primary/10 text-primary",
          )}
        >
          {over
            ? `Перерасход ${formatNumber(Math.abs(remaining))} ккал`
            : `Осталось ${formatNumber(remaining)} ккал`}
        </p>

        {/* Compact macro strip: dot + short label + values + hairline */}
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          {MACROS.map((macro) => {
            const current = totals[macro.key];
            const target = targets[macro.key];
            const macroOver = current > target;
            const percent =
              animated && target > 0
                ? Math.min((current / target) * 100, 100)
                : 0;
            return (
              <div key={macro.key} className="min-w-0">
                <p
                  className="flex items-baseline gap-1.5 text-[12px] text-muted-foreground"
                  aria-label={`${macro.label}: ${formatNumber(current)} из ${formatNumber(target)} г`}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 self-center rounded-full",
                      macro.color,
                    )}
                  />
                  <span className="font-medium">{macro.short}</span>
                  <span className="ml-auto truncate tabular-nums">
                    <span
                      className={cn(
                        "font-semibold text-foreground",
                        macroOver && "text-red-600 dark:text-red-400",
                      )}
                    >
                      {formatNumber(Math.round(current))}
                    </span>{" "}
                    / {formatNumber(target)} г
                  </span>
                </p>
                <div
                  className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.08]"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
                      macro.color,
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thin progress ring — lightweight, no inner text */}
      <SummaryRing current={totals.calories} target={targets.calories} />
    </div>
  );
}

/** Compact 92px calorie progress ring; the numbers live beside it. */
function SummaryRing({ current, target }: { current: number; target: number }) {
  const animated = useMountedForAnimation();
  const size = 92;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress =
    animated && target > 0 ? Math.min(current / target, 1) : 0;
  const over = current > target;

  return (
    <div
      className="relative h-[92px] w-[92px] shrink-0 sm:h-[104px] sm:w-[104px]"
      role="img"
      aria-label={`Съедено ${formatNumber(Math.round(current))} из ${formatNumber(target)} ккал`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-foreground/[0.08]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn(
            "transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none",
            over ? "stroke-red-500 dark:stroke-red-400" : "stroke-primary",
          )}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
    </div>
  );
}
