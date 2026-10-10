import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "What is SIWES?",
    a: "SIWES (Students Industrial Work Experience Scheme) is a skills-training program for Nigerian university and polytechnic students, pairing classroom study with real workplace experience.",
  },
  {
    q: "How does the report generator work?",
    a: "You answer a short, structured questionnaire about your school, your host company, and what you actually did during your internship. AI uses only those answers to write a full academic report.",
  },
  {
    q: "Is the report personalized?",
    a: "Yes. The report is built from your own projects, tasks, tools, and challenges — it isn't a generic template with your name swapped in.",
  },
  {
    q: "Can I edit my report?",
    a: "Yes. After generation you can edit any chapter, regenerate a specific section, or ask AI to improve the writing before you download it.",
  },
  {
    q: "Can I download it as Word?",
    a: "Yes. Every report exports as a professionally formatted .docx file that opens correctly in Microsoft Word.",
  },
  {
    q: "Is my information safe?",
    a: "Your data is stored securely and is only ever accessible to your own account. We never share your personal information with third parties.",
  },
  {
    q: "How many free reports do I get?",
    a: "Every new account gets one free report generation.",
  },
  {
    q: "What happens after my free report?",
    a: "You can purchase additional report credits at any time. Nothing is charged automatically and your existing report stays yours.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Frequently asked questions
        </h2>
      </div>
      <Accordion type="single" collapsible className="mt-10 w-full">
        {FAQS.map(({ q, a }, i) => (
          <AccordionItem key={q} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
