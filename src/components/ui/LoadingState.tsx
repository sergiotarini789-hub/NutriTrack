import { Loader2 } from "lucide-react";

/** Centered loading indicator shown while data is read from storage. */
export function LoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Загрузка">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Загрузка...</span>
      </div>
    </div>
  );
}
