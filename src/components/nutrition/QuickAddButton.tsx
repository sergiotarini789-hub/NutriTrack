"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";
import { Button } from "@/components/ui/Button";

/**
 * Shared "Добавить еду" trigger of the desktop sidebar (Stage 10: on
 * mobile this role moved to the floating add button); opens the
 * standard add-food flow from any screen.
 */
export function QuickAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="h-5 w-5" />
        Добавить еду
      </Button>
      <AddFoodModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
