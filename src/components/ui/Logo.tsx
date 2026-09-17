import { Leaf } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <Leaf className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </span>
      <span className="text-[17px] font-bold tracking-tight text-foreground">
        NutriTrack
      </span>
    </span>
  );
}
