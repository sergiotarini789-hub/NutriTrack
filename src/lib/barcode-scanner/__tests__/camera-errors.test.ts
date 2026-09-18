/**
 * Stage 8A spike tests — camera support checks and error classification.
 *
 * No real camera is used: `window`/`navigator` are stubbed per test.
 * These tests verify the PERMISSION-REQUEST policy (camera is only
 * requested through openCamera, and only when the environment supports
 * it) and that technical DOMException names never leak into the UI.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CAMERA_FAILURE_TEXT,
  classifyCameraError,
  isCameraScanSupported,
  openCamera,
  stopMediaStream,
} from "../camera";

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("classifyCameraError", () => {
  it("maps permission denial", () => {
    expect(classifyCameraError(namedError("NotAllowedError"))).toBe(
      "permission_denied",
    );
    expect(classifyCameraError(namedError("SecurityError"))).toBe(
      "permission_denied",
    );
  });

  it("maps missing camera", () => {
    expect(classifyCameraError(namedError("NotFoundError"))).toBe("no_camera");
    expect(classifyCameraError(namedError("DevicesNotFoundError"))).toBe(
      "no_camera",
    );
  });

  it("maps camera in use / not readable", () => {
    expect(classifyCameraError(namedError("NotReadableError"))).toBe(
      "camera_in_use",
    );
    expect(classifyCameraError(namedError("TrackStartError"))).toBe(
      "camera_in_use",
    );
  });

  it("maps unsupported", () => {
    const error = new Error("unsupported");
    error.name = "UnsupportedCameraError";
    expect(classifyCameraError(error)).toBe("unsupported");
  });

  it("maps everything else to a generic unavailable state", () => {
    expect(classifyCameraError(namedError("AbortError"))).toBe(
      "camera_unavailable",
    );
    expect(classifyCameraError(namedError("TypeError"))).toBe(
      "camera_unavailable",
    );
    expect(classifyCameraError(new Error("boom"))).toBe("camera_unavailable");
    expect(classifyCameraError(undefined)).toBe("camera_unavailable");
  });

  it("works with plain objects carrying a name (non-Error rejections)", () => {
    expect(classifyCameraError({ name: "NotAllowedError" })).toBe(
      "permission_denied",
    );
  });

  it("provides Russian text for every reason without technical details", () => {
    for (const reason of Object.keys(CAMERA_FAILURE_TEXT) as Array<
      keyof typeof CAMERA_FAILURE_TEXT
    >) {
      const text = CAMERA_FAILURE_TEXT[reason];
      expect(text.title.length).toBeGreaterThan(0);
      expect(text.title).toMatch(/[а-яА-Я]/);
    }
    expect(CAMERA_FAILURE_TEXT.permission_denied.title).toBe(
      "Нет доступа к камере",
    );
    expect(CAMERA_FAILURE_TEXT.no_camera.title).toBe("Камера недоступна");
    expect(CAMERA_FAILURE_TEXT.unsupported.title).toBe(
      "Сканирование не поддерживается этим браузером",
    );
  });
});

describe("stopMediaStream", () => {
  it("stops every track", () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
    stopMediaStream({ getTracks: () => tracks } as unknown as MediaStream);
    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
    expect(tracks[1].stop).toHaveBeenCalledTimes(1);
  });

  it("tolerates already-stopped tracks", () => {
    const track = {
      stop: vi.fn(() => {
        throw new Error("already stopped");
      }),
    };
    expect(() =>
      stopMediaStream({ getTracks: () => [track] } as unknown as MediaStream),
    ).not.toThrow();
  });

  it("tolerates null and undefined", () => {
    expect(() => stopMediaStream(null)).not.toThrow();
    expect(() => stopMediaStream(undefined)).not.toThrow();
  });
});

describe("isCameraScanSupported", () => {
  it("returns false without a window (server rendering)", () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(isCameraScanSupported()).toBe(false);
  });

  it("returns false in insecure contexts (plain HTTP LAN IP)", () => {
    vi.stubGlobal("window", { isSecureContext: false });
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: () => Promise.resolve() },
    });
    expect(isCameraScanSupported()).toBe(false);
  });

  it("returns false without mediaDevices.getUserMedia", () => {
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", {});
    expect(isCameraScanSupported()).toBe(false);
  });

  it("returns true in a secure context with getUserMedia", () => {
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: () => Promise.resolve() },
    });
    expect(isCameraScanSupported()).toBe(true);
  });
});

describe("openCamera", () => {
  it("never requests the camera when the environment is unsupported", async () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

    const unsupported = vi.stubGlobal("window", { isSecureContext: false });
    void unsupported;
    await expect(openCamera()).rejects.toMatchObject({
      name: "UnsupportedCameraError",
    });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("requests only video, preferring the rear camera", async () => {
    const fakeStream = { getTracks: () => [] };
    const getUserMedia = vi.fn(() => Promise.resolve(fakeStream));
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

    await expect(openCamera()).resolves.toBe(fakeStream);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  });
});
