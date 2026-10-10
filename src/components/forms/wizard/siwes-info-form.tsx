"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { saveWizardStepAction } from "@/app/generate/actions";
import { siwesInfoSchema, type SiwesInfo } from "@/lib/validation/wizard";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AutosaveIndicator } from "@/components/wizard/autosave-indicator";
import { WizardNav } from "@/components/wizard/wizard-nav";

export function SiwesInfoForm({
  reportId,
  defaultValues,
}: {
  reportId: string;
  defaultValues: SiwesInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<SiwesInfo>({
    resolver: zodResolver(siwesInfoSchema),
    defaultValues,
  });

  const autosaveStatus = useWizardAutosave(reportId, "siwes", form.watch());

  function onSubmit(values: SiwesInfo) {
    startTransition(async () => {
      const result = await saveWizardStepAction(reportId, "siwes", values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/generate/${reportId}/company`);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company / Organisation</FormLabel>
              <FormControl>
                <Input placeholder="e.g. LearnBlit Technologies" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Address</FormLabel>
              <FormControl>
                <Input placeholder="Street, city, state" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 6 months" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departmentTeam"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department / Team</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Software Engineering team" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Don&apos;t know a name below? Leave it blank — we&apos;ll mark it
          &ldquo;To be confirmed&rdquo; rather than guessing.
        </p>

        <FormField
          control={form.control}
          name="industrialSupervisor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industrial Supervisor</FormLabel>
              <FormControl>
                <Input placeholder="Name of your supervisor at the company" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="institutionalSupervisor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institutional Supervisor</FormLabel>
              <FormControl>
                <Input placeholder="Name of your school-assigned supervisor" {...field} />
              </FormControl>
              <FormDescription>The lecturer who visits/assesses your SIWES.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="headOfDepartment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Head of Department</FormLabel>
              <FormControl>
                <Input placeholder="Name of your HOD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AutosaveIndicator status={autosaveStatus} />
        <WizardNav backHref={`/generate/${reportId}/personal`} isSubmitting={isPending} />
      </form>
    </Form>
  );
}
