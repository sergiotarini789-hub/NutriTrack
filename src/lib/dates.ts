/** Local date key in "YYYY-MM-DD" format (no UTC shifts). */
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** The last `count` days including today, ordered from oldest to newest. */
export function lastNDays(count: number): Date[] {
  const today = new Date();
  const days: Date[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    days.push(addDays(today, -i));
  }
  return days;
}

/** e.g. "15 сентября" */
export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
}

/** e.g. "вторник" */
export function weekdayLong(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(date);
}

/** e.g. "Вт" */
export function weekdayShort(date: Date): string {
  const raw = new Intl.DateTimeFormat("ru-RU", { weekday: "short" })
    .format(date)
    .replace(".", "");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** e.g. "17 сентября, четверг" */
export function formatFullDate(date: Date): string {
  return `${formatDayMonth(date)}, ${weekdayLong(date)}`;
}

/** Parses a "YYYY-MM-DD" key into a local Date (no UTC shifts). */
export function dateFromKey(key: string): Date {
  return new Date(
    Number(key.slice(0, 4)),
    Number(key.slice(5, 7)) - 1,
    Number(key.slice(8, 10)),
  );
}

/**
 * The date an Add Food flow may write (Stage 14A): a well-formed
 * "YYYY-MM-DD" key that is not in the future. Anything else — missing,
 * malformed or a future key — resolves to undefined, which the diary
 * reads as "today" (the normal Today flow). A future entry can never
 * be created through this boundary.
 */
export function loggableDate(preselected?: string | null): string | undefined {
  if (!preselected || !/^\d{4}-\d{2}-\d{2}$/.test(preselected)) {
    return undefined;
  }
  return preselected <= todayKey() ? preselected : undefined;
}

/** e.g. "Среда, 16 сентября" — weekday-first label for date context (Stage 14A). */
export function formatWeekdayDayMonth(key: string): string {
  const date = dateFromKey(key);
  const weekday = weekdayLong(date);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatDayMonth(date)}`;
}
