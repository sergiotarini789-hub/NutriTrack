import {
  ProgressBar,
  progressColors,
  type ProgressColor,
} from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

interface MacroStatProps {
  label: string;
  current: number;
  target: number;
  color: ProgressColor;
  /** Highlights the value when the target is exceeded. */
  over?: boolean;
}

/**
 * One compact macro indicator: colored dot + label, current / target
 * value and a slim progress bar. Three of these form the cohesive
 * nutrition overview inside the dashboard hero.
 */
export function MacroStat({
  label,
  current,
  target,
  color,
  over = false,
}: MacroStatProps) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", progressColors[color])} />
        {label}
      </p>
      <p className="mt-1.5 truncate text-sm font-bold tabular-nums text-foreground">
        <span className={cn(over && "text-red-600 dark:text-red-400")}>
          {formatNumber(current)}
        </span>{" "}
        <span className="font-medium text-muted-foreground">
          / {formatNumber(target)} г
        </span>
      </p>
      <div className="mt-2">
        <ProgressBar value={current} max={target} color={color} />
      </div>
    </div>
  );
}
