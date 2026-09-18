/**
 * Stage 8A barcode scanner spike — ZXing fallback engine.
 *
 * Used whenever the native BarcodeDetector API is unavailable (Firefox,
 * Safari/iOS, desktop Chrome on Linux/Windows). @zxing/browser 0.2.1 is
 * actively maintained, written in TypeScript, pure JS (no WASM), and
 * provides the recommended continuous decoding loop with a configurable
 * delay between attempts — we keep its defaults and only restrict the
 * formats to product barcodes.
 *
 * The library is imported dynamically so that (a) it is code-split out of
 * the main bundle and (b) it is never evaluated during server rendering.
 */
import type { BarcodeEngine } from "./types";

/** Delay between decode attempts (ms) — the library's loop, tuned for
 * responsive-but-calm scanning on a phone. */
const SCAN_ATTEMPT_INTERVAL_MS = 300;

export async function createZxingEngine(): Promise<BarcodeEngine> {
  const [browser, library] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ]);

  const hints = new Map<
    import("@zxing/library").DecodeHintType,
    unknown
  >();
  // NOTE: UPC_A is deliberately NOT requested. ZXing's UPC-A reader is a
  // wrapper that strips the leading zero of UPC-A-compatible EAN-13 codes
  // ("0123456789012" → "123456789012"), which would silently alter valid
  // digits and diverge from the native engine. With EAN_13 alone the
  // EAN-13 reader decodes UPC-A symbols in their full 13-digit EAN form
  // (verified by a real decode test). UPC-E is only scanned by the native
  // engine — documented limitation of the fallback.
  hints.set(library.DecodeHintType.POSSIBLE_FORMATS, [
    library.BarcodeFormat.EAN_13,
    library.BarcodeFormat.EAN_8,
  ]);

  const reader = new browser.BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: SCAN_ATTEMPT_INTERVAL_MS,
  });

  let controls: { stop: () => void } | null = null;

  return {
    async start(video, stream, onDetect) {
      // decodeFromStream attaches the stream to the video element itself
      // and runs the library's continuous decoding loop. The callback
      // receives a per-attempt error (NotFoundException) whenever a frame
      // has no barcode — those are simply ignored.
      controls = await reader.decodeFromStream(
        stream,
        video,
        (result) => {
          if (result) onDetect(result.getText());
        },
      );
    },

    stop() {
      controls?.stop();
      controls = null;
    },
  };
}
