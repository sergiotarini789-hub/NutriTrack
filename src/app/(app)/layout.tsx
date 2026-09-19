import type { ReactNode } from "react";
import { AppLaunchProvider } from "@/components/app/AppLaunch";
import { Navigation } from "@/components/navigation/Navigation";
import { FloatingAddButton } from "@/components/nutrition/FloatingAddButton";
import { Logo } from "@/components/ui/Logo";
import { DiaryProvider } from "@/lib/diary";

/**
 * Application shell (Stage 10 redesign): compact product sidebar on
 * desktop; on mobile a slim brand header, bottom navigation and a
 * floating add-food action that stays visually distinct from the nav.
 * Content lives in a centered reading-width column, not a wide
 * dashboard canvas. All screens share the diary state via
 * DiaryProvider and receive the launch experience from AppLaunchProvider.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DiaryProvider>
      <AppLaunchProvider>
        <div className="min-h-dvh">
          <Navigation />

          {/* Mobile: slim brand header (the FAB is the add action) */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg lg:hidden">
            <div className="flex h-12 items-center px-5">
              <Logo />
            </div>
          </header>

          <main className="pb-32 lg:pb-16 lg:pl-56">
            <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
              {children}
            </div>
          </main>

          <FloatingAddButton />
        </div>
      </AppLaunchProvider>
    </DiaryProvider>
  );
}
