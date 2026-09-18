/**
 * Stage 8A spike tests — REAL EAN-13 decoding through the fallback
 * library (NO mocks in this file).
 *
 * A standard-compliant EAN-13 (and EAN-8) barcode is rendered pixel by
 * pixel from the published GS1 module tables, then handed to the real
 * @zxing/library decoder via RGBLuminanceSource — the same decoding core
 * the ZXing camera engine uses on every frame. If either the renderer
 * or the decoder were wrong, these tests could not pass.
 *
 * This is an automated test of the decoding pipeline only: no camera is
 * involved (a real physical camera test is reported separately).
 */
import { describe, expect, it } from "vitest";
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import { normalizeBarcode } from "@/lib/barcode";

/* ------- Minimal standard EAN renderer (test-only) ------- */

/** Left-hand odd (L) patterns for digits 0–9. */
const L_PATTERNS = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];

/** Left-hand even (G) patterns for digits 0–9. */
const G_PATTERNS = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];

/** Right-hand (R) patterns are the complements of L. */
const rPattern = (digit: number) =>
  L_PATTERNS[digit].replace(/./g, (bit) => (bit === "0" ? "1" : "0"));

/** First-digit parity selection for the six left-hand data digits. */
const PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];

function ean13CheckDigit(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

function ean8CheckDigit(first7: string): string {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += Number(first7[i]) * (i % 2 === 0 ? 3 : 1);
  }
  return String((10 - (sum % 10)) % 10);
}

function ean13Modules(code13: string): string {
  const parity = PARITY[Number(code13[0])];
  let modules = "101";
  for (let i = 1; i <= 6; i++) {
    modules +=
      parity[i - 1] === "L" ? L_PATTERNS[Number(code13[i])] : G_PATTERNS[Number(code13[i])];
  }
  modules += "01010";
  for (let i = 7; i <= 12; i++) {
    modules += rPattern(Number(code13[i]));
  }
  return modules + "101";
}

function ean8Modules(code8: string): string {
  let modules = "101";
  for (let i = 0; i < 4; i++) modules += L_PATTERNS[Number(code8[i])];
  modules += "01010";
  for (let i = 4; i < 8; i++) modules += rPattern(Number(code8[i]));
  return modules + "101";
}

function renderToLuminance(
  modules: string,
  quietZone: number,
  scale: number,
  height: number,
): { luminances: Uint8ClampedArray; width: number; height: number } {
  const moduleCount = modules.length;
  const width = (quietZone * 2 + moduleCount) * scale;
  const luminances = new Uint8ClampedArray(width * height).fill(255);
  for (let m = 0; m < moduleCount; m++) {
    if (modules[m] !== "1") continue;
    for (let s = 0; s < scale; s++) {
      const x = (quietZone + m) * scale + s;
      for (let y = 0; y < height; y++) {
        luminances[y * width + x] = 0;
      }
    }
  }
  return { luminances, width, height };
}

function decodeEan(code: string, ean8: boolean): string {
  const modules = ean8 ? ean8Modules(code) : ean13Modules(code);
  const { luminances, width, height } = renderToLuminance(modules, 12, 3, 60);
  const source = new RGBLuminanceSource(luminances, width, height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const hints = new Map<
    import("@zxing/library").DecodeHintType,
    unknown
  >();
  // Mirrors the production engine configuration (EAN-13 + EAN-8 only).
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
  ]);
  const reader = new MultiFormatReader();
  return reader.decode(bitmap, hints).getText();
}

/* ------------------------- Tests ------------------------- */

describe("real ZXing decoding of rendered EAN-13 barcodes", () => {
  it("renders and decodes the Stage 8A QA barcode 4600605017265 unchanged", () => {
    // Sanity: the QA value is a checksum-valid EAN-13.
    expect(ean13CheckDigit("460060501726")).toBe("5");
    expect(decodeEan("4600605017265", false)).toBe("4600605017265");
  });

  it("decodes a leading-zero (UPC-A-compatible) EAN-13 without losing the zero", () => {
    expect(ean13CheckDigit("012345678901")).toBe("2");
    const decoded = decodeEan("0123456789012", false);
    expect(decoded).toBe("0123456789012");
    expect(decoded.startsWith("0")).toBe(true);
  });

  it("feeds normalizeBarcode unchanged (same normalization as manual input)", () => {
    const decoded = decodeEan("4600605017265", false);
    expect(normalizeBarcode(decoded)).toBe("4600605017265");
    const zeroLeading = decodeEan("0123456789012", false);
    expect(normalizeBarcode(zeroLeading)).toBe("0123456789012");
  });

  it("also decodes EAN-8 (naturally supported by the same engine)", () => {
    expect(ean8CheckDigit("4602541")).toBe("8");
    expect(decodeEan("46025418", true)).toBe("46025418");
  });
});
