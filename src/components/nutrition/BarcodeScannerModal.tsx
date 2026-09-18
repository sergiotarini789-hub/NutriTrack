"use client";

/**
 * Stage 8A barcode scanner spike — minimal scanner UI (client-only).
 *
 * Loaded via next/dynamic with `ssr: false`, so none of this code — nor
 * the ZXing chunk it pulls in — is evaluated during server rendering.
 * The camera is requested only after this overlay is opened, which only
 * happens when the user presses «Сканировать штрихкод».
 *
 * Intentionally unpolished: this is a technology spike, not a design
 * stage. Camera preview, guide frame, instruction, close button, error
 * states and the detected-barcode result — nothing more.
 */
import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, ScanBarcode, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CAMERA_FAILURE_TEXT } from "@/lib/barcode-scanner/camera";
import { ScannerSession } from "@/lib/barcode-scanner/scanner-session";
import type { ScannerState } from "@/lib/barcode-scanner/types";

export interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  /** The user accepted the detected barcode — the parent feeds it into
   * the EXISTING barcode lookup flow. */
  onUse: (barcode: string) => void;
}

export default function BarcodeScannerModal({
  open,
  onClose,
  onUse,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<ScannerSession | null>(null);
  const [state, setState] = useState<ScannerState>({ kind: "idle" });

  // Start a fresh session whenever the scanner opens; on close/unmount
  // the session stops the camera (all tracks) and cancels the loop.
  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    if (!video) return;
    const session = new ScannerSession({ video, onStateChange: setState });
    sessionRef.current = session;
    void session.start();
    return () => {
      sessionRef.current = null;
      session.stop();
    };
  }, [open]);

  // Escape closes the scanner (listener removed on cleanup).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const restart = () => void sessionRef.current?.start();
  const detectedBarcode = state.kind === "detected" ? state.barcode : null;
  const failure =
    state.kind === "error" ? CAMERA_FAILURE_TEXT[state.reason] : null;
  const statusText =
    state.kind === "scanning"
      ? "Наведите камеру на штрихкод"
      : state.kind === "detected" || state.kind === "error"
        ? null
        : "Сканирование…";

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Сканирование штрихкода"
    >
      <div className="flex items-center justify-between px-4 pb-1 pt-3 text-white">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <ScanBarcode className="h-5 w-5" aria-hidden />
          Сканирование штрихкода
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть сканер"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="h-full w-full object-cover"
        />
        {/* Static guide frame (no animations — reduced motion safe). */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div className="h-[30%] max-h-40 w-[82%] max-w-sm rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
        {statusText && (
          <p
            aria-live="polite"
            className="absolute inset-x-0 bottom-4 text-center text-[13px] font-medium text-white"
          >
            {statusText}
          </p>
        )}
      </div>

      <div className="bg-black px-4 pb-5 pt-3">
        {detectedBarcode !== null ? (
          <div role="status">
            <p className="flex items-center justify-center gap-2 text-[15px] font-semibold text-white">
              <Check className="h-5 w-5 text-emerald-400" aria-hidden />
              Штрихкод найден
            </p>
            <p className="mt-1 text-center font-mono text-2xl font-semibold tracking-[0.14em] text-white">
              {detectedBarcode}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                size="lg"
                className="w-full rounded-full"
                onClick={() => onUse(detectedBarcode)}
              >
                Использовать
              </Button>
              <Button
                variant="soft"
                size="lg"
                className="w-full rounded-full"
                onClick={restart}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Сканировать ещё раз
              </Button>
            </div>
          </div>
        ) : failure ? (
          <div role="alert">
            <p className="text-center text-[15px] font-semibold text-white">
              {failure.title}
            </p>
            {failure.hint && (
              <p className="mt-1 text-center text-[13px] leading-relaxed text-white/70">
                {failure.hint}
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="soft"
                size="lg"
                className="w-full rounded-full"
                onClick={restart}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Повторить
              </Button>
              <Button
                variant="soft"
                size="lg"
                className="w-full rounded-full"
                onClick={onClose}
              >
                Закрыть
              </Button>
            </div>
          </div>
        ) : (
          <p className="pb-1 text-center text-[13px] leading-relaxed text-white/70">
            Наведите камеру на штрихкод товара
          </p>
        )}
      </div>
    </div>
  );
}
