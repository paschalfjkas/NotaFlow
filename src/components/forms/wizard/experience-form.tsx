"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { saveWizardStepAction } from "@/app/generate/actions";
import { experienceSchema, TASK_OPTIONS, type ExperienceInfo } from "@/lib/validation/wizard";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function ExperienceForm({
  reportId,
  defaultValues,
}: {
  reportId: string;
  defaultValues: ExperienceInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ExperienceInfo>({
    resolver: zodResolver(experienceSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "projects" });
  const autosaveStatus = useWizardAutosave(reportId, "experience", form.watch());

  function onSubmit(values: ExperienceInfo) {
    startTransition(async () => {
      const result = await saveWizardStepAction(reportId, "experience", values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/generate/${reportId}/technologies`);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Projects</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  id: nanoid(),
                  projectName: "",
                  description: "",
                  technologies: "",
                  role: "",
                  learnings: "",
                })
              }
            >
              <Plus className="mr-1 size-4" /> Add another project
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No projects added yet — click &ldquo;Add another project&rdquo; to describe what you
              built or worked on.
            </p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <FormField
                      control={form.control}
                      name={`projects.${index}.projectName`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. LearnBlit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 text-destructive"
                      onClick={() => remove(index)}
                      aria-label="Remove project"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`projects.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What did you do?</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`projects.${index}.technologies`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Technologies Used</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. React, Node.js, PostgreSQL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`projects.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Role</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Frontend developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`projects.${index}.learnings`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What did you learn?</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="tasks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tasks you performed</FormLabel>
              <FormControl>
                <TagMultiSelect
                  options={TASK_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add a task we didn't list…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <AutosaveIndicator status={autosaveStatus} />
        <WizardNav backHref={`/generate/${reportId}/company`} isSubmitting={isPending} />
      </form>
    </Form>
  );
}
