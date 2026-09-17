import type { ReactNode } from "react";
import { Navigation } from "@/components/navigation/Navigation";
import { Logo } from "@/components/ui/Logo";
import { DiaryProvider } from "@/lib/diary";

/**
 * Application shell: sidebar navigation on desktop,
 * top bar + bottom navigation on mobile. All screens share the
 * diary state (entries, targets, profile) via DiaryProvider.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DiaryProvider>
      <div className="min-h-dvh">
        <Navigation />

        {/* Mobile top bar with the app logo (desktop shows the sidebar instead) */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center px-4">
            <Logo />
          </div>
        </header>

        <main className="pb-28 lg:pb-12 lg:pl-64">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </DiaryProvider>
  );
}
