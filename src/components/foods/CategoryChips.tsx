"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CategoryChip {
  id: string;
  name: string;
  icon?: LucideIcon;
}

interface CategoryChipsProps {
  categories: CategoryChip[];
  selected: string;
  onSelect: (id: string) => void;
  /**
   * Ids that stay always visible in a fixed leading group, before the
   * horizontally scrollable region (e.g. "Все" and "Мои продукты" on
   * the Products screen — Stage 13B). Order follows `categories`;
   * without this prop the whole row scrolls as before.
   */
  pinnedIds?: string[];
}

/**
 * Category selector with small food icons; the active category is a
 * solid accent pill. By default one horizontally scrollable row that
 * scrolls back to the start on selection. With `pinnedIds` the listed
 * chips are kept in a fixed group at the beginning (never requiring a
 * scroll to reach them) while the remaining categories scroll.
 */
export function CategoryChips({
  categories,
  selected,
  onSelect,
  pinnedIds,
}: CategoryChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const hasPinned = Array.isArray(pinnedIds) && pinnedIds.length > 0;
  const pinned = hasPinned
    ? categories.filter((category) => pinnedIds.includes(category.id))
    : [];
  const scrollable = hasPinned
    ? categories.filter((category) => !pinnedIds.includes(category.id))
    : categories;

  function renderChip(category: CategoryChip) {
    const active = category.id === selected;
    const Icon = category.icon;
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
          "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm transition-[background-color,color,transform] duration-150 active:scale-95",
          active
            ? "bg-primary font-semibold text-primary-foreground"
            : "bg-foreground/[0.06] font-medium text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              active ? "opacity-90" : "opacity-70",
            )}
          />
        )}
        {category.name}
      </button>
    );
  }

  return (
    <div
      className="-mx-4 flex gap-2 px-4 pb-0.5 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      role="tablist"
      aria-label="Категории продуктов"
    >
      {pinned.length > 0 && (
        <div role="presentation" className="flex shrink-0 gap-2">
          {pinned.map(renderChip)}
        </div>
      )}
      {pinned.length > 0 && (
        <span
          aria-hidden
          className="w-px shrink-0 self-stretch rounded-full bg-border/70"
        />
      )}
      <div
        ref={containerRef}
        className={cn(
          "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          pinned.length > 0 && "min-w-0 flex-1",
        )}
        role={pinned.length > 0 ? "presentation" : undefined}
      >
        {scrollable.map(renderChip)}
      </div>
    </div>
  );
}
