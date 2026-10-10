"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { saveWizardStepAction } from "@/app/generate/actions";
import {
  preferencesSchema,
  REPORT_LENGTH_LABELS,
  WRITING_STYLE_LABELS,
  type PreferencesInfo,
} from "@/lib/validation/wizard";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { AutosaveIndicator } from "@/components/wizard/autosave-indicator";
import { WizardNav } from "@/components/wizard/wizard-nav";
import { cn } from "cn";

const INCLUDE_FIELDS = [
  { name: "includeScreenshots", label: "Include screenshot placeholders?" },
  { name: "includeTables", label: "Include tables?" },
  { name: "includeFigures", label: "Include figures?" },
  { name: "includeReferences", label: "Include references?" },
] as const;

export function PreferencesForm({
  reportId,
  defaultValues,
}: {
  reportId: string;
  defaultValues: PreferencesInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<PreferencesInfo>({
    resolver: zodResolver(preferencesSchema),
    defaultValues,
  });

  const autosaveStatus = useWizardAutosave(reportId, "preferences", form.watch());

  function onSubmit(values: PreferencesInfo) {
    startTransition(async () => {
      const result = await saveWizardStepAction(reportId, "preferences", values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/generate/${reportId}/review`);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="reportLength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report length</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-3">
                  {Object.entries(REPORT_LENGTH_LABELS).map(([value, label]) => (
                    <Label
                      key={value}
                      htmlFor={`length-${value}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-4 font-normal",
                        field.value === value && "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                      )}
                    >
                      <RadioGroupItem value={value} id={`length-${value}`} />
                      {label}
                      {value === "standard" && (
                        <span className="ml-auto text-xs text-muted-foreground">Recommended</span>
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="writingStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Writing style</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-3">
                  {Object.entries(WRITING_STYLE_LABELS).map(([value, label]) => (
                    <Label
                      key={value}
                      htmlFor={`style-${value}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-4 font-normal",
                        field.value === value && "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                      )}
                    >
                      <RadioGroupItem value={value} id={`style-${value}`} />
                      {label}
                      {value === "professional_natural" && (
                        <span className="ml-auto text-xs text-muted-foreground">Recommended</span>
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-3">
          {INCLUDE_FIELDS.map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">{label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>

        <AutosaveIndicator status={autosaveStatus} />
        <WizardNav
          backHref={`/generate/${reportId}/challenges`}
          isSubmitting={isPending}
          continueLabel="Review"
        />
      </form>
    </Form>
  );
}
