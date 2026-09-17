/** Formats a number using Russian locale (e.g. 1540 -> "1 540", 23.6 -> "23,6"). */
export function formatNumber(value: number): string {
  return value.toLocaleString("ru-RU");
}

/** Picks the correct Russian plural form for a count. */
export function pluralize(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
