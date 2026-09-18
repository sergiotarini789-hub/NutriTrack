/**
 * Stage 8A spike tests — ScannerSession lifecycle.
 *
 * The camera, stream, video element and engine are all FAKES injected
 * through the session's test seams (clearly mocks — no real camera).
 * normalizeBarcode is the REAL production utility, so the normalization
 * path exercised here is exactly the one manual input uses.
 */
import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { ScannerSession } from "../scanner-session";
import type { BarcodeEngine, ScannerState } from "../types";

function makeTrack() {
  return { stop: vi.fn() };
}

function makeStream() {
  const tracks = [makeTrack(), makeTrack()];
  const stream = {
    getTracks: () => tracks,
  };
  return { stream: stream as unknown as MediaStream, tracks };
}

function makeVideo() {
  return {
    srcObject: null,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
  } as unknown as HTMLVideoElement & { srcObject: unknown };
}

function makeEngine() {
  let onDetect: ((raw: string) => void) | null = null;
  const engine: BarcodeEngine & {
    emit: (raw: string) => void;
  } = {
    start: vi.fn((_video, _stream, detect) => {
      onDetect = detect;
    }),
    stop: vi.fn(),
    emit: (raw: string) => onDetect?.(raw),
  };
  return engine;
}

interface Harness {
  video: ReturnType<typeof makeVideo>;
  states: ScannerState[];
  session: ScannerSession;
  engine: ReturnType<typeof makeEngine>;
  openStream: ReturnType<typeof vi.fn>;
  engineFactory: ReturnType<typeof vi.fn>;
  stream: ReturnType<typeof makeStream>["stream"];
  tracks: ReturnType<typeof makeTrack>[];
}

function makeHarness(
  overrides: Partial<{
    supported: () => boolean;
    openStream: Mock<() => Promise<MediaStream>>;
    engineFactory: Mock<() => Promise<BarcodeEngine | null>>;
  }> = {},
): Harness {
  const video = makeVideo();
  const states: ScannerState[] = [];
  const { stream, tracks } = makeStream();
  const engine = makeEngine();
  const openStream =
    overrides.openStream ?? vi.fn(() => Promise.resolve(stream));
  const engineFactory =
    overrides.engineFactory ?? vi.fn(() => Promise.resolve(engine));
  const session = new ScannerSession({
    video,
    onStateChange: (state) => states.push(state),
    supported: overrides.supported ?? (() => true),
    openStream,
    engineFactory,
  });
  return { video, states, session, engine, openStream, engineFactory, stream, tracks };
}

describe("ScannerSession — successful scan", () => {
  it("requests the camera, attaches the stream and reaches scanning", async () => {
    const h = makeHarness();
    await h.session.start();
    expect(h.states.map((s) => s.kind)).toEqual(["starting", "scanning"]);
    expect(h.openStream).toHaveBeenCalledTimes(1);
    expect(h.video.srcObject).toBe(h.stream);
    expect(h.video.play).toHaveBeenCalled();
    expect(h.engine.start).toHaveBeenCalledWith(
      h.video,
      h.stream,
      expect.any(Function),
    );
  });

  it("emits exactly ONE result, normalized by the production utility", async () => {
    const h = makeHarness();
    await h.session.start();
    h.engine.emit("4600605017265");
    h.engine.emit("4600605017265");
    h.engine.emit("4600605017265");
    expect(h.states).toHaveLength(3); // starting, scanning, detected
    expect(h.states[2]).toEqual({
      kind: "detected",
      barcode: "4600605017265",
    });
  });

  it("normalizes raw detected values exactly like manual input", async () => {
    const h = makeHarness();
    await h.session.start();
    // Spaced/hyphenated raw values are cleaned by normalizeBarcode.
    h.engine.emit(" 4600-605017 265 ");
    expect(h.states[h.states.length - 1]).toEqual({
      kind: "detected",
      barcode: "4600605017265",
    });
  });

  it("keeps scanning past values that do not normalize (e.g. QR text)", async () => {
    const h = makeHarness();
    await h.session.start();
    const statesAfterScan = h.states.length;
    h.engine.emit("https://example.org/qr");
    expect(h.states).toHaveLength(statesAfterScan);
    h.engine.emit("4602541000592");
    expect(h.states[h.states.length - 1]).toEqual({
      kind: "detected",
      barcode: "4602541000592",
    });
  });

  it("releases the camera and stops the engine right after detection", async () => {
    const h = makeHarness();
    await h.session.start();
    h.engine.emit("4600605017265");
    expect(h.engine.stop).toHaveBeenCalledTimes(1);
    for (const track of h.tracks) {
      expect(track.stop).toHaveBeenCalledTimes(1);
    }
  });
});

describe("ScannerSession — failures", () => {
  it("reports permission denial and never starts an engine", async () => {
    const h = makeHarness({
      openStream: vi.fn((): Promise<MediaStream> =>
        Promise.reject(Object.assign(new Error("denied"), { name: "NotAllowedError" })),
      ),
    });
    await h.session.start();
    expect(h.states[h.states.length - 1]).toEqual({
      kind: "error",
      reason: "permission_denied",
    });
    expect(h.engineFactory).not.toHaveBeenCalled();
    expect(h.engine.start).not.toHaveBeenCalled();
  });

  it("classifies missing camera and busy camera", async () => {
    const missing = makeHarness({
      openStream: vi.fn((): Promise<MediaStream> =>
        Promise.reject(Object.assign(new Error(), { name: "NotFoundError" })),
      ),
    });
    await missing.session.start();
    expect(missing.states[missing.states.length - 1]).toEqual({
      kind: "error",
      reason: "no_camera",
    });

    const busy = makeHarness({
      openStream: vi.fn((): Promise<MediaStream> =>
        Promise.reject(Object.assign(new Error(), { name: "NotReadableError" })),
      ),
    });
    await busy.session.start();
    expect(busy.states[busy.states.length - 1]).toEqual({
      kind: "error",
      reason: "camera_in_use",
    });
  });

  it("reports unsupported without touching the camera", async () => {
    const h = makeHarness({ supported: () => false });
    await h.session.start();
    expect(h.states).toEqual([{ kind: "error", reason: "unsupported" }]);
    expect(h.openStream).not.toHaveBeenCalled();
  });

  it("releases the camera when no engine is available", async () => {
    const h = makeHarness({
      engineFactory: vi.fn((): Promise<BarcodeEngine | null> => Promise.resolve(null)),
    });
    await h.session.start();
    expect(h.states[h.states.length - 1]).toEqual({
      kind: "error",
      reason: "unsupported",
    });
    for (const track of h.tracks) {
      expect(track.stop).toHaveBeenCalledTimes(1);
    }
    expect(h.video.srcObject).toBeNull();
  });

  it("reports camera_unavailable when the video cannot play", async () => {
    const video = {
      srcObject: null,
      play: vi.fn(() => Promise.reject(new Error("play interrupted"))),
      pause: vi.fn(),
    } as unknown as HTMLVideoElement & { srcObject: unknown };
    const { stream, tracks } = makeStream();
    const states: ScannerState[] = [];
    const session = new ScannerSession({
      video,
      onStateChange: (s) => states.push(s),
      supported: () => true,
      openStream: () => Promise.resolve(stream),
      engineFactory: () => Promise.resolve(makeEngine()),
    });
    await session.start();
    expect(states[states.length - 1]).toEqual({
      kind: "error",
      reason: "camera_unavailable",
    });
    for (const track of tracks) {
      expect(track.stop).toHaveBeenCalledTimes(1);
    }
  });
});

describe("ScannerSession — cleanup and races", () => {
  it("stop() stops the engine, stops all tracks and detaches the video", async () => {
    const h = makeHarness();
    await h.session.start();
    h.session.stop();
    expect(h.engine.stop).toHaveBeenCalledTimes(1);
    for (const track of h.tracks) {
      expect(track.stop).toHaveBeenCalledTimes(1);
    }
    expect(h.video.srcObject).toBeNull();
    expect(h.video.pause).toHaveBeenCalled();
  });

  it("stop() is idempotent", async () => {
    const h = makeHarness();
    await h.session.start();
    h.session.stop();
    h.session.stop();
    expect(h.engine.stop).toHaveBeenCalledTimes(1);
  });

  it("close while the permission prompt is pending releases the late stream", async () => {
    const { stream, tracks } = makeStream();
    let resolveOpen: (stream: MediaStream) => void = () => {};
    const openStream = vi.fn(
      (): Promise<MediaStream> =>
        new Promise<MediaStream>((resolve) => {
          resolveOpen = resolve;
        }),
    );
    const h = makeHarness({ openStream });
    const starting = h.session.start();
    h.session.stop();
    resolveOpen(stream);
    await starting;
    expect(h.states.map((s) => s.kind)).toEqual(["starting"]);
    expect(h.engine.start).not.toHaveBeenCalled();
    expect(h.video.srcObject).toBeNull();
    for (const track of tracks) {
      expect(track.stop).toHaveBeenCalledTimes(1);
    }
  });

  it("close while the engine is starting stops that engine", async () => {
    const engine = makeEngine();
    let resolveEngineStart: () => void = () => {};
    engine.start = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveEngineStart = resolve;
        }),
    );
    const h = makeHarness({
      engineFactory: vi.fn((): Promise<BarcodeEngine | null> => Promise.resolve(engine)),
    });
    const starting = h.session.start();
    // Let the session get past the camera and reach the pending engine.
    await vi.waitFor(() => expect(engine.start).toHaveBeenCalled());
    h.session.stop();
    resolveEngineStart();
    await starting;
    expect(engine.stop).toHaveBeenCalledTimes(1);
    expect(h.states[h.states.length - 1].kind).toBe("scanning"); // no error emitted for a deliberate close
  });

  it("engine start failure reports camera_unavailable and cleans up", async () => {
    const engine = makeEngine();
    engine.start = vi.fn(() => Promise.reject(new Error("play timeout")));
    const h = makeHarness({
      engineFactory: vi.fn((): Promise<BarcodeEngine | null> => Promise.resolve(engine)),
    });
    await h.session.start();
    expect(h.states[h.states.length - 1]).toEqual({
      kind: "error",
      reason: "camera_unavailable",
    });
    expect(engine.stop).toHaveBeenCalledTimes(1);
    for (const track of h.tracks) {
      expect(track.stop).toHaveBeenCalledTimes(1);
    }
    expect(h.video.srcObject).toBeNull();
  });

  it("reopening always requests a FRESH stream (dead streams are never reused)", async () => {
    const first = makeStream();
    const second = makeStream();
    const queue: MediaStream[] = [first.stream, second.stream];
    const openStream = vi.fn(
      () => Promise.resolve(queue.shift() as MediaStream),
    );
    const engine = makeEngine();
    const video = makeVideo();
    const states: ScannerState[] = [];
    const session = new ScannerSession({
      video,
      onStateChange: (s) => states.push(s),
      supported: () => true,
      openStream,
      engineFactory: () => Promise.resolve(engine),
    });

    await session.start();
    expect(video.srcObject).toBe(first.stream);
    engine.emit("4600605017265");
    expect(states[states.length - 1]).toEqual({
      kind: "detected",
      barcode: "4600605017265",
    });
    // The first stream was released by the detection itself.
    for (const track of first.tracks) {
      expect(track.stop).toHaveBeenCalledTimes(1);
    }

    await session.start();
    expect(openStream).toHaveBeenCalledTimes(2);
    expect(video.srcObject).toBe(second.stream);
    expect(states[states.length - 1]).toEqual({ kind: "scanning" });
    engine.emit("4602541000592");
    expect(states[states.length - 1]).toEqual({
      kind: "detected",
      barcode: "4602541000592",
    });
    expect(second.tracks.every((t) => t.stop.mock.calls.length === 1)).toBe(true);
  });
});
