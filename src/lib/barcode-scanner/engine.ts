/**
 * Stage 8A barcode scanner spike — engine selection.
 *
 * Prefers the browser-native BarcodeDetector (zero download, hardware
 * accelerated) and falls back to the bundled ZXing engine everywhere
 * else. Never relies on the native API alone: if constructing the
 * detector fails for any reason, ZXing takes over.
 */
import { createNativeEngine, getNativeBarcodeDetector } from "./engine-native";
import type { BarcodeEngine } from "./types";

export async function createBarcodeEngine(): Promise<BarcodeEngine | null> {
  const nativeDetector = getNativeBarcodeDetector();
  if (nativeDetector) {
    return createNativeEngine(nativeDetector);
  }
  try {
    const { createZxingEngine } = await import("./engine-zxing");
    return await createZxingEngine();
  } catch {
    // Neither engine could be initialized.
    return null;
  }
}
