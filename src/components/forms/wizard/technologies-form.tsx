"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { saveWizardStepAction } from "@/app/generate/actions";
import {
  technologiesSchema,
  TECHNOLOGY_CATEGORIES,
  type TechnologiesInfo,
} from "@/lib/validation/wizard";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { AutosaveIndicator } from "@/components/wizard/autosave-indicator";
import { WizardNav } from "@/components/wizard/wizard-nav";
import { ComboboxTagInput } from "@/components/wizard/combobox-tag-input";

const ALL_PRESETS = TECHNOLOGY_CATEGORIES.flatMap((c) => c.options);

export function TechnologiesForm({
  reportId,
  defaultValues,
}: {
  reportId: string;
  defaultValues: TechnologiesInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<TechnologiesInfo>({
    resolver: zodResolver(technologiesSchema),
    defaultValues,
  });

  const autosaveStatus = useWizardAutosave(reportId, "technologies", form.watch());

  function onSubmit(values: TechnologiesInfo) {
    startTransition(async () => {
      const result = await saveWizardStepAction(reportId, "technologies", values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/generate/${reportId}/challenges`);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="technologies"
          render={({ field }) => (
            <FormItem>
              <p className="mb-3 text-sm text-muted-foreground">
                Anything you used — software, tools, equipment, or methods. Start typing for
                suggestions (e.g. Excel, AutoCAD, SPSS, Canva, React), or just add your own.
              </p>
              <ComboboxTagInput
                options={ALL_PRESETS}
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <AutosaveIndicator status={autosaveStatus} />
        <WizardNav backHref={`/generate/${reportId}/experience`} isSubmitting={isPending} />
      </form>
    </Form>
  );
}
