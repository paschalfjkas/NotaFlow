import { Check, Loader2 } from "lucide-react";
import type { AutosaveStatus } from "@/hooks/use-wizard-autosave";
import { cn } from "cn";

export function AutosaveIndicator({ status, className }: { status: AutosaveStatus; className?: string }) {
  if (status === "idle") return <span className={cn("text-xs text-transparent", className)}>·</span>;

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs",
        status === "error" ? "text-destructive" : "text-muted-foreground",
        className
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="size-3 animate-spin" /> Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="size-3" /> Saved
        </>
      )}
      {status === "error" && "Couldn't save — check your connection"}
    </span>
  );
}
