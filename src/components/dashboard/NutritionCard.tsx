import {
  ProgressBar,
  progressColors,
  type ProgressColor,
} from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

/** Soft background tint per macro — one cohesive nutrition strip. */
const TINTS: Record<ProgressColor, string> = {
  primary: "bg-primary/[0.08]",
  protein: "bg-protein/[0.08]",
  fat: "bg-fat/[0.08]",
  carbs: "bg-carbs/[0.08]",
  danger: "bg-red-500/[0.08]",
};

interface MacroStatProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: ProgressColor;
  /** Highlights the value when the target is exceeded. */
  over?: boolean;
}

/**
 * One compact macro indicator inside a softly tinted block: colored
 * dot + label, large current value against the target, slim progress
 * bar. Three of these form the nutrition overview in the hero.
 */
export function MacroStat({
  label,
  current,
  target,
  unit,
  color,
  over = false,
}: MacroStatProps) {
  return (
    <div className={cn("min-w-0 rounded-2xl px-3 py-3 sm:px-3.5", TINTS[color])}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", progressColors[color])} />
        {label}
      </p>
      <p className="mt-1.5 truncate text-[17px] font-bold leading-none tabular-nums tracking-tight text-foreground">
        <span className={cn(over && "text-red-600 dark:text-red-400")}>
          {formatNumber(current)}
        </span>{" "}
        <span className="text-[13px] font-medium tracking-normal text-muted-foreground">
          / {formatNumber(target)} {unit}
        </span>
      </p>
      <div className="mt-2.5">
        <ProgressBar value={current} max={target} color={color} />
      </div>
    </div>
  );
}
