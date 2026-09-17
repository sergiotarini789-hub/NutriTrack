import { ProgressBar, progressColors, type ProgressColor } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

interface NutritionCardProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: ProgressColor;
}

/** Label, current / target value and a progress bar for one nutrient. */
export function NutritionCard({
  label,
  current,
  target,
  unit,
  color,
}: NutritionCardProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className={cn("h-2 w-2 rounded-full", progressColors[color])} />
          {label}
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">
            {formatNumber(current)}
          </span>{" "}
          / {formatNumber(target)} {unit}
        </span>
      </div>
      <div className="mt-2">
        <ProgressBar value={current} max={target} color={color} />
      </div>
    </div>
  );
}
