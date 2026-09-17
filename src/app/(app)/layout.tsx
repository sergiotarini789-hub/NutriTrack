import type { ReactNode } from "react";
import { Navigation } from "@/components/navigation/Navigation";
import { QuickAddButton } from "@/components/nutrition/QuickAddButton";
import { Logo } from "@/components/ui/Logo";
import { DiaryProvider } from "@/lib/diary";

/**
 * Application shell: borderless sidebar with a quick-add action on
 * desktop; frosted header with a round add button + bottom navigation
 * on mobile. All screens share the diary state via DiaryProvider.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DiaryProvider>
      <div className="min-h-dvh">
        <Navigation />

        {/* Mobile top bar (desktop shows the sidebar instead) */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo />
            <QuickAddButton variant="icon" />
          </div>
        </header>

        <main className="pb-28 lg:pb-16 lg:pl-64">
          <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </DiaryProvider>
  );
}
