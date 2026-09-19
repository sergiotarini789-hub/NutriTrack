"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Mobile bottom navigation (Stage 10): quiet frosted bar; the active
 * destination is marked with a soft accent tint and colored label —
 * calm, clearly readable, never competing with the floating add
 * action. Comfortable 56px touch targets.
 */
export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Основная навигация"
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 pb-1 pt-1.5"
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                <Icon
                  className="h-[21px] w-[21px]"
                  strokeWidth={active ? 2.4 : 2}
                />
              </span>
              <span
                className={cn(
                  "text-[11px] leading-none",
                  active
                    ? "font-semibold text-primary"
                    : "font-medium text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
