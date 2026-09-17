import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Primary surface: filled, borderless, with a soft elevation shadow so
 * it sits clearly above the page background. Hairlines are added via
 * className only where long divided lists need them.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-card shadow-[0_1px_2px_rgba(8,15,10,0.05)] dark:shadow-[0_3px_14px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...props}
    />
  );
}
