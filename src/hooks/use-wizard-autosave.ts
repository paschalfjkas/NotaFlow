"use client";

import { useEffect, useRef, useState } from "react";
import { saveWizardStepAction } from "@/app/generate/actions";
import type { WizardStep } from "@/lib/validation/wizard";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave for a wizard step: saves `values` ~1.2s after the user
 * stops typing, so progress survives a closed tab without saving on every
 * keystroke. Skipped on the very first render (the values a form starts
 * with aren't a change worth persisting).
 */
export function useWizardAutosave(
  reportId: string,
  step: WizardStep,
  values: Record<string, unknown>
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const isFirstRun = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serialized = JSON.stringify(values);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("idle");

    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      const result = await saveWizardStepAction(reportId, step, JSON.parse(serialized));
      setStatus("error" in result ? "error" : "saved");
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [serialized, reportId, step]);

  return status;
}
