import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

interface CalorieRingProps {
  current: number;
  target: number;
}

/**
 * The dashboard's primary visual: circular calorie progress with the
 * consumed amount in large type. The arc animates when the value
 * changes; visually capped at 100% while the center stays accurate.
 */
export function CalorieRing({ current, target }: CalorieRingProps) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
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
        <span className="text-[40px] font-bold leading-none tabular-nums tracking-tight text-foreground sm:text-[44px]">
          {formatNumber(current)}
        </span>
        <span className="mt-2 text-xs font-medium text-muted-foreground">
          из {formatNumber(target)} ккал
        </span>
      </div>
    </div>
  );
}
