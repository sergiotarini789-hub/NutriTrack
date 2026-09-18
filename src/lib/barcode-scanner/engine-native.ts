/**
 * Stage 8A barcode scanner spike — native BarcodeDetector engine.
 *
 * Uses the browser's experimental Barcode Detection API where available
 * (Chrome on Android, Samsung Internet, Chrome/Edge desktop on
 * ChromeOS/macOS). It is NOT available in Firefox or Safari — those
 * browsers use the ZXing engine instead (engine-zxing.ts).
 *
 * Detection loop: a single non-overlapping chain of `detect()` calls
 * separated by a pause, so at most one detection is in flight at a time
 * (the API's recommended pattern for video scanning). The loop ends on
 * the first detection.
 */
import type { BarcodeDetectorLike, BarcodeEngine } from "./types";

/** Product barcodes only — keeps detection focused and cheap. */
const DETECTOR_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/** Pause between detection attempts (ms). */
const DETECT_INTERVAL_MS = 200;

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

/**
 * Returns a native detector instance, or null when the API is missing or
 * refuses the requested formats. Safe to call during server rendering
 * (returns null without touching `window`).
 */
export function getNativeBarcodeDetector(): BarcodeDetectorLike | null {
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
    return null;
  }
  const ctor = (
    window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
  ).BarcodeDetector;
  if (typeof ctor !== "function") return null;
  try {
    return new ctor({ formats: [...DETECTOR_FORMATS] });
  } catch {
    return null;
  }
}

/** Builds an engine around an already-constructed detector. */
export function createNativeEngine(
  detector: BarcodeDetectorLike,
  intervalMs: number = DETECT_INTERVAL_MS,
): BarcodeEngine {
  let stopped = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancelTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    start(video, _stream, onDetect) {
      cancelTimer();
      stopped = false;

      const tick = async () => {
        if (stopped) return;
        let codes: Array<{ rawValue: string }> = [];
        try {
          codes = await detector.detect(video);
        } catch {
          // Transient frame errors (e.g. video not ready yet) — retry.
        }
        if (stopped) return;
        if (codes.length > 0) {
          // First hit ends the loop; the session also calls stop().
          onDetect(codes[0].rawValue);
          return;
        }
        if (!stopped) timer = setTimeout(tick, intervalMs);
      };

      timer = setTimeout(tick, 0);
    },

    stop() {
      stopped = true;
      cancelTimer();
    },
  };
}
