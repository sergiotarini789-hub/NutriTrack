import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

/** Grouped settings block: small uppercase title + divided surface. */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <Card className="divide-y divide-border/70">{children}</Card>
    </section>
  );
}
