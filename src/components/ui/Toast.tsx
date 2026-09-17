"use client";

import { createPortal } from "react-dom";
import { Check } from "lucide-react";

/** Inverse confirmation toast floating above the bottom navigation. */
export function Toast({ message }: { message: string | null }) {
  if (!message || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8"
      role="status"
    >
      <div className="animate-sheet-in flex max-w-full items-center gap-2.5 rounded-full bg-foreground py-2.5 pl-3.5 pr-5 text-background shadow-lg">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background/20">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <p className="truncate text-sm font-medium">{message}</p>
      </div>
    </div>,
    document.body,
  );
}
