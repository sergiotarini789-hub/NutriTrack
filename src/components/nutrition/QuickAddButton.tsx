"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";
import { Button } from "@/components/ui/Button";

interface QuickAddButtonProps {
  /** "full" — wide button in the desktop sidebar; "icon" — round mobile-header button. */
  variant?: "full" | "icon";
}

/**
 * Shared "Добавить еду" trigger used in the desktop sidebar and the
 * mobile header; opens the standard add-food flow from any screen.
 */
export function QuickAddButton({ variant = "full" }: QuickAddButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "full" ? (
        <Button
          size="lg"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Добавить еду
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Добавить еду"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      )}
      <AddFoodModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
