"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { saveWizardStepAction } from "@/app/generate/actions";
import { personalInfoSchema, type PersonalInfo } from "@/lib/validation/wizard";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { Input } from "@/components/ui/input";
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

export function PersonalInfoForm({
  reportId,
  defaultValues,
}: {
  reportId: string;
  defaultValues: PersonalInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues,
  });

  const autosaveStatus = useWizardAutosave(reportId, "personal", form.watch());

  function onSubmit(values: PersonalInfo) {
    startTransition(async () => {
      const result = await saveWizardStepAction(reportId, "personal", values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/generate/${reportId}/siwes`);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Chidinma Okafor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="matricNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matriculation Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 190401234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University</FormLabel>
              <FormControl>
                <Input placeholder="e.g. University of Lagos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="facultySchool"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Faculty / School</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Faculty of Science" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Computer Science" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="programme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programme</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. B.Sc. Computer Science" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="academicSession"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Academic Session</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2025/2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="graduationYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Graduation Year</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 2027" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AutosaveIndicator status={autosaveStatus} />
        <WizardNav backHref={null} isSubmitting={isPending} />
      </form>
    </Form>
  );
}
