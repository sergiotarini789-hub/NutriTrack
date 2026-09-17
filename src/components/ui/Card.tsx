import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Filled surface without a border — the app's default container.
 * Add `border border-border` via className only where a hairline
 * genuinely helps (e.g. long divided lists).
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-3xl bg-card", className)}
      {...props}
    />
  );
}
