"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Working light/dark switch (stored in localStorage, applied via .dark class). */
export function ThemeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("nutritrack-theme", next ? "dark" : "light");
    } catch {
      // localStorage may be unavailable — ignore
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Тёмная тема"
      onClick={toggle}
      className={cn(
        "relative h-7 w-12 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        enabled ? "bg-primary" : "bg-foreground/20",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
          enabled && "translate-x-5",
        )}
      />
    </button>
  );
}
