import { describe, expect, it } from "vitest";
import { normalizeBarcode } from "../barcode";

describe("normalizeBarcode", () => {
  it("keeps plain digits", () => {
    expect(normalizeBarcode("4601234567891")).toBe("4601234567891");
  });

  it("removes spaces", () => {
    expect(normalizeBarcode("46 0010 3101")).toBe("4600103101");
  });

  it("removes hyphens", () => {
    expect(normalizeBarcode("4-6010-3101-9")).toBe("4601031019");
  });

  it("removes spaces and hyphens together", () => {
    expect(normalizeBarcode(" 46-0010 310-19 ")).toBe("46001031019");
  });

  it("returns undefined for empty string", () => {
    expect(normalizeBarcode("")).toBeUndefined();
  });

  it("returns undefined for whitespace-only input", () => {
    expect(normalizeBarcode("   ")).toBeUndefined();
  });

  it("returns undefined for null and undefined", () => {
    expect(normalizeBarcode(null)).toBeUndefined();
    expect(normalizeBarcode(undefined)).toBeUndefined();
  });

  it("returns undefined for non-numeric input", () => {
    expect(normalizeBarcode("abc123")).toBeUndefined();
    expect(normalizeBarcode("46a010")).toBeUndefined();
  });

  it("is idempotent", () => {
    const once = normalizeBarcode("46-0010 3101");
    expect(normalizeBarcode(once)).toBe(once);
  });
});
