/**
 * Three-mode theme system: "system" (default), "light" and "dark".
 * The chosen mode is stored in localStorage under the legacy
 * "nutritrack-theme" key — previously it held "light"/"dark", which
 * map directly to the fixed modes, so existing data keeps working.
 */
export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "nutritrack-theme";

const MODES: readonly ThemeMode[] = ["system", "light", "dark"];

export const THEME_LABELS: Record<ThemeMode, string> = {
  system: "Системная",
  light: "Светлая",
  dark: "Тёмная",
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

/** Reads the stored mode; defaults to "system". */
export function loadThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    return isThemeMode(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Applies the .dark class to <html> according to the mode. */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const dark = mode === "dark" || (mode === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

/** Persists the mode and applies it (with a soft color transition). */
export function setThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    // storage unavailable — still apply for this session
  }
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && typeof document !== "undefined") {
    document.documentElement.classList.add("theme-anim");
    window.setTimeout(
      () => document.documentElement.classList.remove("theme-anim"),
      300,
    );
  }
  applyTheme(mode);
}
