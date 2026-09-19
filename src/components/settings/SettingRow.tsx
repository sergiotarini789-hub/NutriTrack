import type { ReactNode } from "react";

interface SettingRowProps {
  label: string;
  children?: ReactNode;
  /** Optional validation message shown under the row (Russian). */
  error?: string | null;
}

export function SettingRow({ label, children, error }: SettingRowProps) {
  return (
    <div className="px-5 py-3.5 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <span className="min-w-0 text-[15px] text-foreground">{label}</span>
        {children && (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-1.5 text-right text-[13px] leading-snug text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}
