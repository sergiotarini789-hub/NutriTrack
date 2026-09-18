/**
 * Stage 8A barcode scanner spike — camera access helpers.
 *
 * Browser-only: every function guards `window`/`navigator` so an
 * accidental import during server rendering cannot touch them.
 *
 * Permission policy: the camera is requested ONLY when `openCamera` is
 * called, i.e. after the user pressed «Сканировать штрихкод» and the
 * scanner UI opened. Nothing here runs at app start or when the add-food
 * modal opens.
 */
import type { CameraFailureReason } from "./types";

/** Can this environment attempt camera scanning at all? */
export function isCameraScanSupported(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  // getUserMedia requires a secure context (HTTPS or localhost).
  if (window.isSecureContext === false) {
    return false;
  }
  return typeof navigator.mediaDevices?.getUserMedia === "function";
}

/** Error thrown by openCamera when the environment cannot scan at all. */
export class UnsupportedCameraError extends Error {
  readonly name = "UnsupportedCameraError";
}

/**
 * Opens the camera. On phones the rear (environment) camera is preferred
 * via `ideal` — if it is missing the browser gracefully falls back to any
 * available camera instead of failing (no `exact`, no device enumeration).
 */
export async function openCamera(): Promise<MediaStream> {
  if (!isCameraScanSupported()) {
    throw new UnsupportedCameraError();
  }
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });
}

/** Stops every track of a stream — the only correct way to release a camera. */
export function stopMediaStream(
  stream: MediaStream | null | undefined,
): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // A track may already be stopped — releasing must never throw.
    }
  }
}

/**
 * Maps a getUserMedia failure to a user-facing reason. Technical names
 * (DOMException codes etc.) never reach the UI.
 */
export function classifyCameraError(error: unknown): CameraFailureReason {
  const name =
    (error as { name?: unknown } | null | undefined)?.name ??
    (error instanceof Error ? error.name : "");
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "permission_denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "no_camera";
    case "NotReadableError":
    case "TrackStartError":
      return "camera_in_use";
    case "UnsupportedCameraError":
      return "unsupported";
    default:
      return "camera_unavailable";
  }
}

/** Russian UI text for every failure reason (no technical details). */
export const CAMERA_FAILURE_TEXT: Record<
  CameraFailureReason,
  { title: string; hint?: string }
> = {
  permission_denied: {
    title: "Нет доступа к камере",
    hint: "Разрешите доступ к камере в настройках браузера и попробуйте ещё раз.",
  },
  no_camera: {
    title: "Камера недоступна",
    hint: "На устройстве не найдена камера.",
  },
  camera_in_use: {
    title: "Камера недоступна",
    hint: "Возможно, камера используется другим приложением.",
  },
  camera_unavailable: {
    title: "Камера недоступна",
    hint: "Попробуйте ещё раз.",
  },
  unsupported: {
    title: "Сканирование не поддерживается этим браузером",
    hint: "Откройте приложение в современном браузере по защищённому соединению (HTTPS).",
  },
};
