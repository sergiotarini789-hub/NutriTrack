"use client";

import { createPortal } from "react-dom";
import { Check } from "lucide-react";

interface ToastProps {
  /** Main line, e.g. "Добавлено". */
  message: string | null;
  /** Optional second line with short context, e.g. "Яйцо · +157 ккал". */
  detail?: string | null;
}

/** Inverse confirmation toast floating above the bottom navigation. */
export function Toast({ message, detail }: ToastProps) {
  if (!message || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8"
      role="status"
    >
      <div className="animate-sheet-in flex max-w-full items-center gap-2.5 rounded-2xl bg-foreground py-2.5 pl-3.5 pr-5 text-background shadow-lg">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background/20">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{message}</p>
          {detail && (
            <p className="truncate text-xs leading-tight opacity-75">{detail}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
