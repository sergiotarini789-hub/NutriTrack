import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Unit shown inside the input on the right, e.g. "кг". */
  unit?: string;
  /** Validation message shown under the input. */
  error?: string | null;
}

export function Input({ label, unit, error, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </span>
      )}
      <span className="relative block">
        <input
          className={cn(
            "h-12 w-full rounded-xl border bg-card px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-border focus:border-primary focus:ring-primary/20",
            unit && "pr-14",
            className,
          )}
          {...props}
        />
        {unit && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </span>
      {error && (
        <p className="mt-1.5 text-[13px] text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}
