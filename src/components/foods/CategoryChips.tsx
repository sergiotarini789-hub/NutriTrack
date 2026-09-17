"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

export interface CategoryChip {
  id: string;
  name: string;
}

interface CategoryChipsProps {
  categories: CategoryChip[];
  selected: string;
  onSelect: (id: string) => void;
}

/**
 * Horizontally scrollable category selector.
 * Scrolls the active chip into view on mobile.
 */
export function CategoryChips({
  categories,
  selected,
  onSelect,
}: CategoryChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Категории продуктов"
    >
      {categories.map((category) => {
        const active = category.id === selected;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              onSelect(category.id);
              containerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
            }}
            className={cn(
              "h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-foreground/5",
            )}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
