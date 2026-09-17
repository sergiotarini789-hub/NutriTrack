import type { ReactNode } from "react";

interface SettingRowProps {
  label: string;
  children?: ReactNode;
}

export function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
      <span className="min-w-0 text-[15px] text-foreground">{label}</span>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
