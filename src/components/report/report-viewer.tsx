import { Badge } from "@/components/ui/badge";

export type ReportSectionRow = {
  id: string;
  section_key: string;
  chapter_number: number | null;
  title: string;
  content: string;
  table_data?: { caption: string; headers: string[]; rows: string[][] } | null;
  order_index: number;
};

function SectionTable({ table }: { table: { caption: string; headers: string[]; rows: string[][] } }) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs italic text-muted-foreground">{table.caption}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {table.headers.map((header, i) => (
                <th key={i} className="border bg-muted px-2 py-1 text-left font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {table.headers.map((_, j) => (
                  <td key={j} className="border px-2 py-1">
                    {row[j] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CHAPTER_HEADINGS: Record<number, string> = {
  1: "Chapter One — Introduction",
  2: "Chapter Two — Company Profile and Organisational Overview",
  3: "Chapter Three — Industrial Experience and Work Undertaken",
  4: "Chapter Four — Challenges Encountered and Solutions",
  5: "Chapter Five — Summary, Conclusion and Recommendations",
};

const PRELIMINARY_LABELS: Record<string, string> = {
  cover_title: "Cover Title",
  certification: "Certification",
  dedication: "Dedication",
  acknowledgement: "Acknowledgement",
  abstract: "Abstract",
  references: "References",
  appendices: "Appendices",
};

export function ReportViewer({ sections }: { sections: ReportSectionRow[] }) {
  const preliminary = sections
    .filter((s) => s.chapter_number === null)
    .sort((a, b) => a.order_index - b.order_index);

  const chapterNumbers = Array.from(
    new Set(sections.filter((s) => s.chapter_number !== null).map((s) => s.chapter_number!))
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        {preliminary.map((section) => (
          <div key={section.id}>
            <Badge variant="secondary" className="mb-2">
              {PRELIMINARY_LABELS[section.section_key] ?? section.title}
            </Badge>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{section.content}</p>
          </div>
        ))}
      </section>

      {chapterNumbers.map((num) => {
        const chapterSections = sections
          .filter((s) => s.chapter_number === num)
          .sort((a, b) => a.order_index - b.order_index);

        return (
          <section key={num}>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              {CHAPTER_HEADINGS[num] ?? `Chapter ${num}`}
            </h2>
            <div className="space-y-5">
              {chapterSections.map((section) => (
                <div key={section.id}>
                  <h3 className="mb-1.5 font-medium">{section.title}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {section.content}
                  </p>
                  {section.table_data && <SectionTable table={section.table_data} />}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
