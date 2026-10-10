"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { saveWizardStepAction } from "@/app/generate/actions";
import {
  challengesSchema,
  PROFESSIONAL_SKILL_OPTIONS,
  type ChallengesInfo,
} from "@/lib/validation/wizard";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AutosaveIndicator } from "@/components/wizard/autosave-indicator";
import { WizardNav } from "@/components/wizard/wizard-nav";
import { TagMultiSelect } from "@/components/wizard/tag-multi-select";

export function ChallengesForm({
  reportId,
  defaultValues,
}: {
  reportId: string;
  defaultValues: ChallengesInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ChallengesInfo>({
    resolver: zodResolver(challengesSchema),
    defaultValues,
  });

  const autosaveStatus = useWizardAutosave(reportId, "challenges", form.watch());

  function onSubmit(values: ChallengesInfo) {
    startTransition(async () => {
      const result = await saveWizardStepAction(reportId, "challenges", values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/generate/${reportId}/preferences`);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="biggestChallenge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What was your biggest challenge?</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="howSolved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How did you solve it?</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="technicalSkills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technical skills you gained</FormLabel>
              <FormControl>
                <TagMultiSelect
                  options={[]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g. REST API design, SQL query optimisation…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="professionalSkills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional skills you gained</FormLabel>
              <FormControl>
                <TagMultiSelect
                  options={PROFESSIONAL_SKILL_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mostImportantLearning"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What was the most important thing you learned?</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <AutosaveIndicator status={autosaveStatus} />
        <WizardNav backHref={`/generate/${reportId}/technologies`} isSubmitting={isPending} />
      </form>
    </Form>
  );
}
