import { cn } from "@/lib/cn";

export type ProgressColor =
  | "primary"
  | "protein"
  | "fat"
  | "carbs"
  | "danger";

const COLORS: Record<ProgressColor, string> = {
  primary: "bg-primary",
  protein: "bg-protein",
  fat: "bg-fat",
  carbs: "bg-carbs",
  danger: "bg-red-500 dark:bg-red-400",
};

export const progressColors = COLORS;

interface ProgressBarProps {
  value: number;
  max: number;
  color?: ProgressColor;
}

/** Slim progress bar; the fill animates when the value changes. */
export function ProgressBar({ value, max, color = "primary" }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.10]"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
          COLORS[color],
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
