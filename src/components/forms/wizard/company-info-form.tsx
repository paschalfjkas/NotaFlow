"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { saveWizardStepAction } from "@/app/generate/actions";
import { companyInfoSchema, type CompanyInfo } from "@/lib/validation/wizard";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

export function CompanyInfoForm({
  reportId,
  defaultValues,
}: {
  reportId: string;
  defaultValues: CompanyInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<CompanyInfo>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues,
  });

  const dontKnow = form.watch("dontKnow");
  const autosaveStatus = useWizardAutosave(reportId, "company", form.watch());

  function onSubmit(values: CompanyInfo) {
    startTransition(async () => {
      const result = await saveWizardStepAction(reportId, "company", values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/generate/${reportId}/experience`);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="dontKnow"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 rounded-lg border bg-muted/30 p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div>
                <FormLabel className="font-medium">Don&apos;t know this information?</FormLabel>
                <p className="text-sm text-muted-foreground">
                  That&apos;s fine — leave the fields below blank. You can always come back and
                  fill them in later; the AI won&apos;t invent company facts you haven&apos;t
                  given it.
                </p>
              </div>
            </FormItem>
          )}
        />

        {!dontKnow && (
          <>
            <FormField
              control={form.control}
              name="whatCompanyDoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What does the company do?</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fintech, EdTech, Oil & Gas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productsServices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Products / Services</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="mission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vision</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="coreValues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Core Values</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Integrity, Innovation, Excellence" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departments</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Engineering, Sales, HR" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teamWorkedWith"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team You Worked With</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Backend engineering team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 50 employees" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <AutosaveIndicator status={autosaveStatus} />
        <WizardNav backHref={`/generate/${reportId}/siwes`} isSubmitting={isPending} />
      </form>
    </Form>
  );
}
