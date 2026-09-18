/**
 * Stage 8A spike tests — native BarcodeDetector engine.
 *
 * The detector is a MOCK (a plain object with a detect() function) — no
 * real camera or native API is involved. These tests verify the loop
 * behaviour: non-overlapping attempts, throttling, stopping, and that
 * the loop ends after the first hit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNativeEngine, getNativeBarcodeDetector } from "../engine-native";
import type { BarcodeDetectorLike } from "../types";

const video = {} as HTMLVideoElement;
const stream = {} as MediaStream;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mockDetector(
  behave: (attempt: number) => Array<{ rawValue: string }> | Error,
): BarcodeDetectorLike & { calls: number } {
  let attempt = 0;
  return {
    calls: 0,
    async detect() {
      this.calls++;
      const result = behave(attempt++);
      if (result instanceof Error) throw result;
      return result;
    },
  } as BarcodeDetectorLike & { calls: number };
}

describe("createNativeEngine", () => {
  it("reports the first detected raw value", async () => {
    const detector = mockDetector(() => [{ rawValue: "4600605017265" }]);
    const onDetect = vi.fn();
    createNativeEngine(detector).start(video, stream, onDetect);
    await vi.advanceTimersByTimeAsync(0);
    expect(onDetect).toHaveBeenCalledTimes(1);
    expect(onDetect).toHaveBeenCalledWith("4600605017265");
  });

  it("ends the loop after the first hit — no duplicate emissions", async () => {
    const detector = mockDetector(() => [{ rawValue: "4600605017265" }]);
    const onDetect = vi.fn();
    createNativeEngine(detector).start(video, stream, onDetect);
    await vi.advanceTimersByTimeAsync(5000);
    expect(onDetect).toHaveBeenCalledTimes(1);
    expect(detector.calls).toBe(1);
  });

  it("keeps polling while nothing is detected, with pauses", async () => {
    const detector = mockDetector(() => []);
    const onDetect = vi.fn();
    createNativeEngine(detector, 200).start(video, stream, onDetect);
    await vi.advanceTimersByTimeAsync(0);
    expect(detector.calls).toBe(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(detector.calls).toBe(2);
    await vi.advanceTimersByTimeAsync(600);
    expect(detector.calls).toBe(5);
    expect(onDetect).not.toHaveBeenCalled();
  });

  it("stops polling after stop()", async () => {
    const detector = mockDetector(() => []);
    const engine = createNativeEngine(detector, 200);
    engine.start(video, stream, vi.fn());
    await vi.advanceTimersByTimeAsync(200);
    const callsAtStop = detector.calls;
    engine.stop();
    await vi.advanceTimersByTimeAsync(2000);
    expect(detector.calls).toBe(callsAtStop);
  });

  it("recovers from transient detect() failures", async () => {
    const detector = mockDetector((attempt) =>
      attempt < 2 ? new Error("frame not ready") : [{ rawValue: "4602541000592" }],
    );
    const onDetect = vi.fn();
    createNativeEngine(detector, 50).start(video, stream, onDetect);
    await vi.advanceTimersByTimeAsync(500);
    expect(onDetect).toHaveBeenCalledWith("4602541000592");
  });
});

describe("getNativeBarcodeDetector", () => {
  it("returns null during server rendering (no window)", () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(getNativeBarcodeDetector()).toBeNull();
  });

  it("returns null when the API is missing", () => {
    vi.stubGlobal("window", {});
    expect(getNativeBarcodeDetector()).toBeNull();
  });

  it("returns a detector restricted to product barcode formats", () => {
    const constructed: Array<{ formats?: string[] } | undefined> = [];
    class FakeBarcodeDetector {
      constructor(options?: { formats?: string[] }) {
        constructed.push(options);
      }
      detect() {
        return Promise.resolve([]);
      }
    }
    vi.stubGlobal("window", { BarcodeDetector: FakeBarcodeDetector });
    const detector = getNativeBarcodeDetector();
    expect(detector).toBeInstanceOf(FakeBarcodeDetector);
    expect(constructed[0]?.formats).toEqual([
      "ean_13",
      "ean_8",
      "upc_a",
      "upc_e",
    ]);
  });

  it("returns null when construction throws (e.g. bad formats)", () => {
    vi.stubGlobal("window", {
      BarcodeDetector: class {
        constructor() {
          throw new Error("unsupported format");
        }
      },
    });
    expect(getNativeBarcodeDetector()).toBeNull();
  });
});
