/**
 * Stage 8A barcode scanner spike — shared types.
 *
 * The scanner is deliberately split into small, browser-only pieces:
 *  - `BarcodeEngine` abstracts "look at this video and report raw codes"
 *    (native BarcodeDetector or the ZXing fallback);
 *  - `ScannerSession` (scanner-session.ts) owns the camera stream, the
 *    engine lifecycle and duplicate-result suppression;
 *  - React only renders state — it never touches camera APIs directly.
 *
 * Nothing in this folder may run during server rendering: every module
 * accesses `window`/`navigator` only inside functions.
 */

/** Why a scan could not start / stopped failing. */
export type CameraFailureReason =
  | "permission_denied"
  | "no_camera"
  | "camera_in_use"
  | "camera_unavailable"
  | "unsupported";

/**
 * Lifecycle of one scanning session. `detected` is emitted exactly once
 * per successful scan; `error` carries the failure reason (UI text is
 * mapped from the reason in components, Russian only).
 */
export type ScannerState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: "detected"; barcode: string }
  | { kind: "error"; reason: CameraFailureReason };

/**
 * A detection engine. `start` begins observing the already-live video
 * element (the session owns the MediaStream and passes it along) and may
 * call `onDetect` with RAW detected values repeatedly; `stop` must cancel
 * the detection loop and remove any listeners/timers it created.
 */
export interface BarcodeEngine {
  start(
    video: HTMLVideoElement,
    stream: MediaStream,
    onDetect: (rawValue: string) => void,
  ): Promise<void> | void;
  stop(): void;
}

/** Minimal shape of the experimental native BarcodeDetector we rely on. */
export interface BarcodeDetectorLike {
  detect(source: unknown): Promise<Array<{ rawValue: string }>>;
}
