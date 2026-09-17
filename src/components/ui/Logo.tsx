import { Leaf } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Leaf className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[17px] font-semibold tracking-tight text-foreground">
        NutriTrack
      </span>
    </span>
  );
}
