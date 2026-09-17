import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "soft" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover active:bg-primary-hover",
  soft: "bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20",
  secondary:
    "bg-foreground/[0.06] text-foreground hover:bg-foreground/10 active:bg-foreground/[0.12]",
  ghost: "text-foreground hover:bg-foreground/5 active:bg-foreground/10",
  danger:
    "bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-[15px] rounded-2xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Pressable with subtle scale feedback. `soft` is the tinted accent
 * variant used for secondary actions on colored contexts.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 font-semibold transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
