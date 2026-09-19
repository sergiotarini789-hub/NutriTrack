"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";

/**
 * Mobile floating add-food action (Stage 10): a distinct round button
 * hovering above the bottom navigation — visually separate from the
 * navigation destinations, reachable from anywhere in the app with a
 * thumb. Hidden on desktop, where the sidebar carries the primary
 * "Добавить еду" action instead.
 */
export function FloatingAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Добавить еду"
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-150 active:scale-90 hover:bg-primary-hover motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 lg:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <AddFoodModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
