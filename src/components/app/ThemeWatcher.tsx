"use client";

import { useEffect } from "react";
import { applyTheme, loadThemeMode } from "@/lib/theme";

/**
 * Keeps the applied theme in sync with the OS preference while the
 * user's selected mode is "Системная". Renders nothing.
 */
export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (loadThemeMode() === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return null;
}
