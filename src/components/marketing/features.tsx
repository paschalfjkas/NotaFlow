import {
  FileEdit,
  FileType2,
  ImageIcon,
  Smartphone,
  Sparkles,
  Gift,
  GraduationCap,
  UserCheck,
} from "lucide-react";

const FEATURES = [
  { icon: Sparkles, title: "AI-powered report generation", description: "Structured, chapter-by-chapter report writing from your answers." },
  { icon: UserCheck, title: "Personalized content", description: "Written around your actual internship, not a generic template." },
  { icon: GraduationCap, title: "Professional academic structure", description: "Cover page, certification, abstract, chapters and references." },
  { icon: FileType2, title: "Microsoft Word export", description: "A properly formatted .docx file that opens cleanly in Word." },
  { icon: FileEdit, title: "Editable report", description: "Fine-tune any chapter before you download." },
  { icon: ImageIcon, title: "Screenshot placeholders", description: "Marked spots for your own project screenshots." },
  { icon: Smartphone, title: "Mobile friendly", description: "Fill out the questionnaire and review your report from your phone." },
  { icon: Gift, title: "One free report", description: "No card required for your first generation." },
];

export function Features() {
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Everything you need to finish your report
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border bg-background p-5">
              <Icon className="size-6 text-indigo-600 dark:text-indigo-400" />
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
