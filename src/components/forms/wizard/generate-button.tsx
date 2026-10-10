"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateReportAction, getGenerationStatusAction } from "@/app/generate/actions";
import { GENERATION_STAGE_ORDER, STAGE_LABELS, type GenerationStage } from "@/lib/ai/stages";
import { Button } from "@/components/ui/button";

export function GenerateButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<GenerationStage | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling() {
    pollRef.current = setInterval(async () => {
      const status = await getGenerationStatusAction(reportId);
      if (status?.generation_stage) {
        setStage(status.generation_stage as GenerationStage);
      }
    }, 1500);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setStage("understanding");
    startPolling();

    const result = await generateReportAction(reportId);

    if (pollRef.current) clearInterval(pollRef.current);
    setIsGenerating(false);
    setStage(null);

    if ("error" in result) {
      if (result.code === "insufficient_credits") {
        toast.error(result.error, {
          action: { label: "Buy credits", onClick: () => router.push("/dashboard/billing") },
        });
      } else {
        toast.error(result.error);
      }
      return;
    }

    router.push(`/report/${reportId}`);
  }

  if (isGenerating) {
    return (
      <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/60 p-6 dark:border-indigo-900 dark:bg-indigo-950/30">
        <h3 className="text-center font-semibold">Creating your SIWES report…</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {GENERATION_STAGE_ORDER.map((s, i) => {
            const currentIndex = stage ? GENERATION_STAGE_ORDER.indexOf(stage) : 0;
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
        <p className="mt-4 text-center text-xs text-muted-foreground">
          This can take a minute or two — please don&apos;t close this tab.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/60 p-6 text-center dark:border-indigo-900 dark:bg-indigo-950/30">
      <Sparkles className="mx-auto size-8 text-indigo-600 dark:text-indigo-400" />
      <h3 className="mt-3 font-semibold">Ready to generate your report</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        AI will turn your answers into a full SIWES report, structured into chapters, using only
        what you&apos;ve told it.
      </p>
      <Button className="mt-4" onClick={handleGenerate}>
        Generate My Report
      </Button>
    </div>
  );
}
