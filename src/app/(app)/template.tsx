import type { ReactNode } from "react";

/**
 * Re-mounts on every navigation between app sections and plays a
 * quick 200ms page transition (opacity + tiny rise).
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
