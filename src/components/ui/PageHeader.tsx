interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

/** Page title block: calm semibold title with a quiet subtitle. */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
