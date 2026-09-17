"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Logo } from "@/components/ui/Logo";
import { launchGreeting, launchPhrase } from "@/lib/greeting";
import { prefersReducedMotion } from "@/lib/motion";
import { loadProfile } from "@/lib/storage";

/** Session flag set right after onboarding — suppresses the splash once. */
const JUST_ONBOARDED_KEY = "nutritrack:just-onboarded";

/** Phases of the short branded launch sequence. */
type LaunchPhase = "pending" | "splash" | "leaving" | "done";

const SPLASH_HOLD_MS = 950;
const SPLASH_LEAVE_MS = 350;

interface AppLaunchValue {
  /** True once the launch sequence finished (or was skipped). */
  launched: boolean;
}

const AppLaunchContext = createContext<AppLaunchValue>({ launched: true });

export function useAppLaunch(): AppLaunchValue {
  return useContext(AppLaunchContext);
}

/**
 * Short branded launch experience (~1.3s): logo, a time-aware
 * personal greeting and a calm phrase, then the app fades in.
 * Skipped entirely for reduced-motion users and right after
 * onboarding; never blocks longer than the animation itself.
 */
export function AppLaunchProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<LaunchPhase>("pending");

  useEffect(() => {
    const skip =
      prefersReducedMotion() ||
      sessionStorage.getItem(JUST_ONBOARDED_KEY) === "1";
    if (skip) {
      sessionStorage.removeItem(JUST_ONBOARDED_KEY);
      setPhase("done");
      return;
    }
    setPhase("splash");
    const leave = window.setTimeout(
      () => setPhase("leaving"),
      SPLASH_HOLD_MS,
    );
    const done = window.setTimeout(() => setPhase("done"), SPLASH_HOLD_MS + SPLASH_LEAVE_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, []);

  const value = useMemo<AppLaunchValue>(
    () => ({ launched: phase === "done" || phase === "leaving" }),
    [phase],
  );

  // DOM marker used by QA (and potential CSS) to know the app is live.
  useEffect(() => {
    if (value.launched) {
      document.documentElement.setAttribute("data-launched", "true");
    }
  }, [value.launched]);

  return (
    <AppLaunchContext.Provider value={value}>
      {children}
      {phase !== "done" && <LaunchSplash leaving={phase === "leaving"} />}
    </AppLaunchContext.Provider>
  );
}

/** The branded overlay itself. The greeting appears after hydration. */
function LaunchSplash({ leaving }: { leaving: boolean }) {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [phrase, setPhrase] = useState<string | null>(null);

  useEffect(() => {
    // localStorage is only readable on the client.
    setGreeting(launchGreeting(loadProfile().name));
    setPhrase(launchPhrase());
  }, []);

  return (
    <div
      data-splash=""
      aria-hidden="true"
      className={
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-[350ms] ease-out " +
        (leaving ? "pointer-events-none opacity-0" : "opacity-100")
      }
    >
      <div className="animate-logo-in">
        <Logo className="scale-125" />
      </div>
      <div
        className="animate-splash-text-in mt-6 flex flex-col items-center px-8 text-center"
        style={{ animationDelay: "180ms" }}
      >
        <p className="min-h-7 text-[22px] font-bold tracking-tight text-foreground">
          {greeting ?? "\u00A0"}
        </p>
        <p className="mt-1 min-h-5 text-sm text-muted-foreground">
          {phrase ?? "\u00A0"}
        </p>
      </div>
    </div>
  );
}
