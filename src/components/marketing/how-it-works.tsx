import { ClipboardList, Download, Sparkles, UserCircle } from "lucide-react";

const STEPS = [
  {
    icon: UserCircle,
    title: "Tell us about yourself",
    description: "Your school, department, and internship placement details.",
  },
  {
    icon: ClipboardList,
    title: "Tell us about your SIWES experience",
    description: "Projects, tasks, tools and challenges — in your own words.",
  },
  {
    icon: Sparkles,
    title: "AI creates your report",
    description: "A full academic report structured into chapters, based only on what you shared.",
  },
  {
    icon: Download,
    title: "Download your Word document",
    description: "Review, edit, and export a professionally formatted .docx file.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
        <p className="mt-3 text-muted-foreground">
          From a blank page to a finished report in four steps.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <div key={title} className="rounded-xl border bg-background p-5">
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-sm font-semibold text-indigo-700 dark:text-indigo-400">
              {i + 1}
            </div>
            <Icon className="mt-4 size-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
