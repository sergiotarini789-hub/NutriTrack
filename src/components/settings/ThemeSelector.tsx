"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  THEME_LABELS,
  loadThemeMode,
  setThemeMode,
  type ThemeMode,
} from "@/lib/theme";

const MODES: ThemeMode[] = ["system", "light", "dark"];

/**
 * Segmented theme selector: Системная / Светлая / Тёмная.
 * The choice is persisted and applied with a soft color transition.
 */
export function ThemeSelector() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    setMode(loadThemeMode());
  }, []);

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-2xl bg-foreground/[0.05] p-1"
      role="radiogroup"
      aria-label="Тема"
    >
      {MODES.map((option) => {
        const active = mode === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              setMode(option);
              setThemeMode(option);
            }}
            className={cn(
              "h-10 truncate rounded-xl px-1 text-[13px] transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              active
                ? "bg-card font-semibold text-foreground shadow-sm"
                : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {THEME_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
