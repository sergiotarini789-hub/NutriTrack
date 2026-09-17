import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

interface CalorieRingProps {
  current: number;
  target: number;
}

/** Circular progress ring with the consumed calories in the center. */
export function CalorieRing({ current, target }: CalorieRingProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  // Visually cap at 100%, but the center value stays accurate.
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circumference * (1 - progress);
  const over = current > target;

  return (
    <div className="relative h-40 w-40 sm:h-44 sm:w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="12"
          className="stroke-foreground/10"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          className={cn(
            over
              ? "stroke-red-500 dark:stroke-red-400"
              : "stroke-primary",
          )}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
          {formatNumber(current)}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          из {formatNumber(target)} ккал
        </span>
      </div>
    </div>
  );
}
