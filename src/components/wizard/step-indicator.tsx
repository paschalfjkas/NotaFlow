import { Progress } from "@/components/ui/progress";
import { STEP_LABELS, WIZARD_STEPS, type WizardStep } from "@/lib/validation/wizard";

export function StepIndicator({ step }: { step: WizardStep }) {
  const index = WIZARD_STEPS.indexOf(step);
  const total = WIZARD_STEPS.length;
  const percent = Math.round(((index + 1) / total) * 100);

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">
          Step {index + 1} of {total}
        </span>
        <span className="font-medium text-indigo-700 dark:text-indigo-400">{percent}%</span>
      </div>
      <Progress value={percent} className="h-2" />
      <h1 className="mt-4 text-xl font-semibold tracking-tight">{STEP_LABELS[step]}</h1>
    </div>
  );
}
