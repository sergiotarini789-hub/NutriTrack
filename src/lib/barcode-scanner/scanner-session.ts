/**
 * Stage 8A barcode scanner spike — scanning session.
 *
 * Framework-free state machine that owns one camera stream + one
 * detection engine at a time. React components only render the states it
 * emits, which keeps the critical invariants unit-testable without a
 * browser:
 *
 *  1. The camera is requested only via start() (user pressed the scan
 *     button) — never on construction.
 *  2. Exactly ONE accepted result per scan: after a barcode is detected
 *     and normalized, further callbacks are ignored until the user
 *     explicitly starts a new scan. Open Food Facts is never called from
 *     here at all — the consumer passes the code to the existing lookup.
 *  3. Full cleanup on stop()/unmount: engine loop cancelled, every
 *     MediaStream track stopped, video source detached. Reopening always
 *     requests a fresh stream (a dead stream is never reused).
 *  4. start() after start(), or stop() while start() is still awaiting
 *     the camera/engine, is race-free via a monotonically increasing
 *     run id: stale continuations clean up after themselves.
 *
 * Raw detected values pass through the EXISTING normalizeBarcode utility
 * (src/lib/barcode.ts) — the same normalization as manual input. Values
 * that do not normalize (e.g. QR text) are ignored and scanning
 * continues.
 */
import { normalizeBarcode } from "@/lib/barcode";
import {
  classifyCameraError,
  isCameraScanSupported,
  openCamera,
  stopMediaStream,
} from "./camera";
import { createBarcodeEngine } from "./engine";
import type { BarcodeEngine, CameraFailureReason, ScannerState } from "./types";

export interface ScannerSessionOptions {
  /** The <video> element the stream is attached to. */
  video: HTMLVideoElement;
  /** State transitions for the UI. */
  onStateChange: (state: ScannerState) => void;
  /**
   * Injectable seams used by unit tests (no real camera, no real
   * engines). Production callers omit them.
   */
  supported?: () => boolean;
  openStream?: () => Promise<MediaStream>;
  engineFactory?: () => Promise<BarcodeEngine | null>;
  normalize?: (raw: string) => string | undefined;
}

export class ScannerSession {
  private readonly video: HTMLVideoElement;
  private readonly onStateChange: (state: ScannerState) => void;
  private readonly supported: () => boolean;
  private readonly openStream: () => Promise<MediaStream>;
  private readonly engineFactory: () => Promise<BarcodeEngine | null>;
  private readonly normalize: (raw: string) => string | undefined;

  /** Bumped on every teardown; continuations of stale runs self-abort. */
  private runId = 0;
  /** Duplicate suppression: set once a result was accepted. */
  private locked = false;
  private stream: MediaStream | null = null;
  private engine: BarcodeEngine | null = null;

  constructor(options: ScannerSessionOptions) {
    this.video = options.video;
    this.onStateChange = options.onStateChange;
    this.supported = options.supported ?? isCameraScanSupported;
    this.openStream = options.openStream ?? openCamera;
    this.engineFactory = options.engineFactory ?? createBarcodeEngine;
    this.normalize = options.normalize ?? normalizeBarcode;
  }

  /** Starts (or restarts) a scan with a fresh camera stream. */
  async start(): Promise<void> {
    this.teardown();
    const run = this.runId;
    this.locked = false;

    if (!this.supported()) {
      this.fail("unsupported");
      return;
    }

    this.emit({ kind: "starting" });

    let stream: MediaStream;
    try {
      stream = await this.openStream();
    } catch (error) {
      this.fail(classifyCameraError(error));
      return;
    }
    if (this.runId !== run) {
      // Scanner was closed while the permission prompt was pending.
      stopMediaStream(stream);
      return;
    }
    this.stream = stream;

    try {
      this.video.srcObject = stream;
      await this.video.play();
    } catch {
      this.teardown();
      this.fail("camera_unavailable");
      return;
    }
    if (this.runId !== run) {
      this.teardown();
      return;
    }

    let engine: BarcodeEngine | null = null;
    try {
      engine = await this.engineFactory();
    } catch {
      engine = null;
    }
    if (this.runId !== run) {
      engine?.stop();
      this.teardown();
      return;
    }
    if (!engine) {
      // No detection engine available (and dynamic import failed).
      this.teardown();
      this.fail("unsupported");
      return;
    }
    this.engine = engine;

    this.emit({ kind: "scanning" });
    try {
      await engine.start(this.video, stream, (raw) =>
        this.handleDetection(raw, run),
      );
    } catch {
      // The engine failed to start (e.g. video never became playable).
      if (this.runId === run) {
        this.teardown();
        this.fail("camera_unavailable");
      }
      return;
    }
    // If the run went stale while the engine was starting, the teardown
    // inside stop() has already stopped this engine.
  }

  /** Full cleanup: detection loop, camera stream, video source. */
  stop(): void {
    this.teardown();
  }

  private handleDetection(raw: string, run: number): void {
    if (run !== this.runId || this.locked) return;
    const code = this.normalize(raw);
    if (!code) return; // not a usable barcode — keep scanning
    this.locked = true;
    // Freeze this run: any further callbacks are ignored.
    this.runId++;
    this.engine?.stop();
    this.engine = null;
    // Release the camera immediately; the preview keeps its last frame.
    stopMediaStream(this.stream);
    this.stream = null;
    this.emit({ kind: "detected", barcode: code });
  }

  private teardown(): void {
    this.runId++;
    this.locked = true;
    this.engine?.stop();
    this.engine = null;
    stopMediaStream(this.stream);
    this.stream = null;
    try {
      this.video.srcObject = null;
    } catch {
      // Detaching must never throw during cleanup.
    }
    try {
      this.video.pause();
    } catch {
      // Same.
    }
  }

  private fail(reason: CameraFailureReason): void {
    this.emit({ kind: "error", reason });
  }

  private emit(state: ScannerState): void {
    this.onStateChange(state);
  }
}
