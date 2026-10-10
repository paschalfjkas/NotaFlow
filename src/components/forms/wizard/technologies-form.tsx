"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import { saveWizardStepAction } from "@/app/generate/actions";
import {
  technologiesSchema,
  TECHNOLOGY_CATEGORIES,
  type TechnologiesInfo,
} from "@/lib/validation/wizard";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { AutosaveIndicator } from "@/components/wizard/autosave-indicator";
import { WizardNav } from "@/components/wizard/wizard-nav";
import { OptionToggleGrid } from "@/components/wizard/option-toggle-grid";

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
  const [customInput, setCustomInput] = useState("");
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
          render={({ field }) => {
            const customEntries = field.value.filter((v) => !ALL_PRESETS.includes(v));

            function addCustom() {
              const trimmed = customInput.trim();
              if (trimmed && !field.value.includes(trimmed)) {
                field.onChange([...field.value, trimmed]);
              }
              setCustomInput("");
            }

            return (
              <FormItem className="space-y-6">
                {TECHNOLOGY_CATEGORIES.map((category) => (
                  <div key={category.label}>
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                      {category.label}
                    </h3>
                    <OptionToggleGrid
                      options={category.options}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </div>
                ))}

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Anything else you used?
                  </h3>
                  {customEntries.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {customEntries.map((entry) => (
                        <Badge key={entry} variant="secondary" className="gap-1 py-1.5 pl-3 pr-2">
                          {entry}
                          <button
                            type="button"
                            onClick={() => field.onChange(field.value.filter((v) => v !== entry))}
                            aria-label={`Remove ${entry}`}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="e.g. Figma, Jira, Postman…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustom();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addCustom}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <AutosaveIndicator status={autosaveStatus} />
        <WizardNav backHref={`/generate/${reportId}/experience`} isSubmitting={isPending} />
      </form>
    </Form>
  );
}
