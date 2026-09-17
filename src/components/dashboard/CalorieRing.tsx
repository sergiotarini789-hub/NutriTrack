"use client";

import { formatNumber } from "@/lib/format";
import { useCountUp, useMountedForAnimation } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface CalorieRingProps {
  current: number;
  target: number;
}

/**
 * The dashboard's primary visual: circular calorie progress with the
 * consumed amount in large type. On open the arc sweeps from zero and
 * the number counts up (~650ms); on changes both animate from the
 * previous state. Visually capped at 100% while the values stay exact.
 */
export function CalorieRing({ current, target }: CalorieRingProps) {
  const animated = useMountedForAnimation();
  const display = useCountUp(current, 650);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const progress = animated && target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circumference * (1 - progress);
  const over = current > target;

  return (
    <div className="relative h-44 w-44 sm:h-48 sm:w-48">
      <svg viewBox="0 0 176 176" className="h-full w-full -rotate-90">
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          strokeWidth="13"
          className="stroke-foreground/[0.07]"
        />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          strokeWidth="13"
          strokeLinecap="round"
          className={cn(
            "transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none",
            over ? "stroke-red-500 dark:stroke-red-400" : "stroke-primary",
          )}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[42px] font-bold leading-none tabular-nums tracking-tight text-foreground sm:text-5xl">
          {formatNumber(Math.round(display))}
        </span>
        <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          ккал
        </span>
        <span className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
          из {formatNumber(target)} ккал
        </span>
      </div>
    </div>
  );
}
