import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";

/**
 * Responsive application navigation:
 * sidebar on desktop, bottom bar on mobile.
 */
export function Navigation() {
  return (
    <>
      <Sidebar />
      <MobileNavigation />
    </>
  );
}
