interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

/** Page title block: large semibold title with a quiet subtitle. */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-5 sm:mb-6">
      <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground lg:text-[15px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
