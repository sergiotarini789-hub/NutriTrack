"use client";

import { createPortal } from "react-dom";
import { CheckCircle2 } from "lucide-react";

/** Lightweight confirmation toast shown at the bottom of the screen. */
export function Toast({ message }: { message: string | null }) {
  if (!message || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8"
      role="status"
    >
      <div className="animate-sheet-in flex max-w-full items-center gap-2.5 rounded-full border border-border bg-card py-2.5 pl-4 pr-5 shadow-lg">
        <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-primary" />
        <p className="truncate text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>,
    document.body,
  );
}
