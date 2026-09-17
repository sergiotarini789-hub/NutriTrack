/**
 * Minimal barcode normalization. Removes spaces and hyphens and keeps
 * the digits; returns undefined for empty or non-numeric values.
 * Deliberately light — real validation (checksums, EAN/UPC rules)
 * belongs to a future stage that actually consumes barcodes.
 */
export function normalizeBarcode(
  value: string | null | undefined,
): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[\s-]/g, "");
  if (!cleaned || !/^\d+$/.test(cleaned)) return undefined;
  return cleaned;
}
