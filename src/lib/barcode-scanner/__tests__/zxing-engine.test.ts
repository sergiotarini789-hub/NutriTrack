/**
 * Stage 8A spike tests — ZXing fallback engine wiring.
 *
 * @zxing/browser and @zxing/library are MOCKED here (vi.mock): these
 * tests verify that the engine is configured correctly (product formats
 * only, throttled attempt loop) and that results are translated. The
 * REAL decoding of a real EAN-13 bitmap is covered separately in
 * ean13-decode.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readerArgs: null as { hints: Map<number, unknown>; options: unknown } | null,
  decodeFromStream: vi.fn(),
  controlsStop: vi.fn(),
}));

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    constructor(
      hints: Map<number, unknown>,
      options: unknown,
    ) {
      mocks.readerArgs = { hints, options };
    }
    decodeFromStream = mocks.decodeFromStream;
  },
}));

vi.mock("@zxing/library", () => ({
  DecodeHintType: { POSSIBLE_FORMATS: 2 },
  BarcodeFormat: { EAN_13: 13, EAN_8: 8, UPC_A: 12, UPC_E: 9 },
}));

import { createZxingEngine } from "../engine-zxing";

const stream = {} as MediaStream;
const video = {} as HTMLVideoElement;

beforeEach(() => {
  mocks.readerArgs = null;
  mocks.controlsStop.mockClear();
  // The arguments are inspected through mock.calls in the tests below.
  mocks.decodeFromStream.mockReset().mockImplementation(
    async () => ({ stop: mocks.controlsStop }),
  );
});

describe("createZxingEngine", () => {
  it("configures the reader for product formats with a throttled loop", async () => {
    await createZxingEngine();
    expect(mocks.readerArgs).not.toBeNull();
    // EAN_13 + EAN_8 only — see the comment in engine-zxing.ts for why
    // UPC_A must not be requested (leading-zero stripping).
    expect(mocks.readerArgs?.hints.get(2)).toEqual([13, 8]);
    expect(mocks.readerArgs?.options).toEqual({
      delayBetweenScanAttempts: 300,
    });
  });

  it("decodes from OUR stream into OUR video element", async () => {
    const engine = await createZxingEngine();
    await engine.start(video, stream, vi.fn());
    expect(mocks.decodeFromStream).toHaveBeenCalledTimes(1);
    const [callStream, callVideo] = mocks.decodeFromStream.mock.calls[0];
    expect(callStream).toBe(stream);
    expect(callVideo).toBe(video);
  });

  it("emits getText() of successful results only", async () => {
    const engine = await createZxingEngine();
    const onDetect = vi.fn();
    await engine.start(video, stream, onDetect);
    const callback = mocks.decodeFromStream.mock.calls[0][2];

    // ZXing calls back with (result, error, controls); missed frames
    // arrive as a result of undefined plus a NotFoundException.
    callback(undefined);
    callback(undefined);
    expect(onDetect).not.toHaveBeenCalled();

    callback({ getText: () => "4600605017265" });
    expect(onDetect).toHaveBeenCalledTimes(1);
    expect(onDetect).toHaveBeenCalledWith("4600605017265");
  });

  it("stops the scanning loop via the controls", async () => {
    const engine = await createZxingEngine();
    await engine.start(video, stream, vi.fn());
    expect(mocks.controlsStop).not.toHaveBeenCalled();
    engine.stop();
    expect(mocks.controlsStop).toHaveBeenCalledTimes(1);
  });
});
