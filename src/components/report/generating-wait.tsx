"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getGenerationStatusAction } from "@/app/generate/actions";
import { GENERATION_STAGE_ORDER, STAGE_LABELS, type GenerationStage } from "@/lib/ai/stages";

/** Polls real generation status and refreshes the server page once it settles. */
export function GeneratingWait({
  reportId,
  initialStage,
}: {
  reportId: string;
  initialStage: string | null;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<GenerationStage | null>(
    (initialStage as GenerationStage) ?? "understanding"
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const status = await getGenerationStatusAction(reportId);
      if (!status) return;

      if (status.status === "completed" || status.status === "failed") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        router.refresh();
        return;
      }

      if (status.generation_stage) {
        setStage(status.generation_stage as GenerationStage);
      }
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reportId, router]);

  const currentIndex = stage ? GENERATION_STAGE_ORDER.indexOf(stage) : 0;

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-background p-8 text-center">
      <Loader2 className="mx-auto size-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      <h1 className="mt-4 text-lg font-semibold">Creating your SIWES report…</h1>
      <ul className="mt-5 space-y-2 text-left text-sm">
        {GENERATION_STAGE_ORDER.map((s, i) => {
          const done = i < currentIndex;
          const active = s === stage;
          return (
            <li key={s} className="flex items-center gap-2">
              {done ? (
                <span className="text-green-600 dark:text-green-400">✓</span>
              ) : active ? (
                <Loader2 className="size-4 animate-spin text-indigo-600 dark:text-indigo-400" />
              ) : (
                <span className="size-4 text-center text-muted-foreground">○</span>
              )}
              <span className={done || active ? "" : "text-muted-foreground"}>
                {STAGE_LABELS[s]}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-xs text-muted-foreground">
        This can take a minute or two — feel free to leave this tab open in the background.
      </p>
    </div>
  );
}
