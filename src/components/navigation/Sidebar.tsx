"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QuickAddButton } from "@/components/nutrition/QuickAddButton";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Desktop sidebar (Stage 10): compact and visually quiet — a narrow
 * 224px rail that recedes behind the content column. The add action
 * stays primary; navigation items are small, calm and clearly
 * secondary to the page.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col px-4 py-6 lg:flex">
      <div className="flex shrink-0 items-center px-2">
        <Link href="/today" aria-label="NutriTrack — на главную">
          <Logo />
        </Link>
      </div>

      <div className="mt-7 shrink-0">
        <QuickAddButton />
      </div>

      <nav
        className="mt-7 flex-1 space-y-1 overflow-y-auto"
        aria-label="Основная навигация"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className="shrink-0 px-2 text-xs text-muted-foreground/70">
        NutriTrack · версия 0.1.0
      </p>
    </aside>
  );
}
