import "server-only";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import type { SectionRow } from "@/lib/sections";
import type { ScreenshotRow } from "@/lib/screenshots";
import type { GeneratedTable } from "@/lib/ai/schema";
import type { ReportData } from "@/lib/validation/wizard";
import { downloadFile } from "@/lib/storage";

const FONT = "Times New Roman";
const BODY_SIZE = 24; // half-points: 12pt
const LINE_SPACING_1_5 = { line: 360, lineRule: "auto" as const };

function bodyParagraphs(text: string): Paragraph[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { ...LINE_SPACING_1_5, after: 200 },
          children: [new TextRun({ text: paragraph, font: FONT, size: BODY_SIZE })],
        })
    );
}

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 32, bold: true })],
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true })],
  });
}

function centered(text: string, opts: { size?: number; bold?: boolean } = {}): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 150 },
    children: [
      new TextRun({ text, font: FONT, size: opts.size ?? BODY_SIZE, bold: opts.bold ?? false }),
    ],
  });
}

async function screenshotBlock(screenshot: ScreenshotRow, figureNumber: number): Promise<Paragraph[]> {
  if (screenshot.storage_path) {
    try {
      const data = await downloadFile(screenshot.storage_path);
      const ext = screenshot.storage_path.split(".").pop()?.toLowerCase();
      const imageType = ext === "jpg" || ext === "jpeg" ? "jpg" : ext === "gif" ? "gif" : ext === "bmp" ? "bmp" : "png";
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 },
          children: [
            new ImageRun({
              type: imageType,
              data,
              transformation: { width: 420, height: 280 },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `Figure ${figureNumber}: ${screenshot.caption}`,
              font: FONT,
              size: 22,
              italics: true,
            }),
          ],
        }),
      ];
    } catch {
      // Fall through to placeholder if the stored file can't be read.
    }
  }

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      border: {
        top: { style: BorderStyle.DASHED, size: 6, color: "999999" },
        bottom: { style: BorderStyle.DASHED, size: 6, color: "999999" },
        left: { style: BorderStyle.DASHED, size: 6, color: "999999" },
        right: { style: BorderStyle.DASHED, size: 6, color: "999999" },
      },
      children: [
        new TextRun({
          text: `[ SCREENSHOT PLACEHOLDER — insert approved screenshot: ${screenshot.caption} ]`,
          font: FONT,
          size: BODY_SIZE,
          italics: true,
          color: "666666",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Figure ${figureNumber}: ${screenshot.caption}`,
          font: FONT,
          size: 22,
          italics: true,
        }),
      ],
    }),
  ];
}

function tableCell(text: string, opts: { bold?: boolean } = {}): TableCell {
  return new TableCell({
    width: { size: 100, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: [new TextRun({ text, font: FONT, size: 22, bold: opts.bold ?? false })],
      }),
    ],
  });
}

function tableBlock(table: GeneratedTable, tableNumber: number): (Paragraph | Table)[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: `Table ${tableNumber}: ${table.caption}`,
          font: FONT,
          size: 22,
          italics: true,
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: table.headers.map((h) => tableCell(h, { bold: true })),
        }),
        ...table.rows.map(
          (row) =>
            new TableRow({
              children: table.headers.map((_, i) => tableCell(row[i] ?? "")),
            })
        ),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ];
}

// Fallback text for reports generated before References/Appendices became
// real, persisted `report_sections` rows — those older reports have no
// matching row at all, so byKey() would otherwise return an empty string.
const REFERENCES_FALLBACK =
  "[Add the references you consulted during your SIWES placement — e.g. your institution's SIWES handbook, ITF guidelines, or course materials.]";
const APPENDICES_FALLBACK =
  "[Attach any supporting materials here, such as your SIWES logbook or letters.]";

const CHAPTER_HEADINGS: Record<number, string> = {
  1: "CHAPTER ONE — INTRODUCTION",
  2: "CHAPTER TWO — COMPANY PROFILE AND ORGANISATIONAL OVERVIEW",
  3: "CHAPTER THREE — INDUSTRIAL EXPERIENCE AND WORK UNDERTAKEN",
  4: "CHAPTER FOUR — CHALLENGES ENCOUNTERED AND SOLUTIONS",
  5: "CHAPTER FIVE — SUMMARY, CONCLUSION AND RECOMMENDATIONS",
};

export async function buildReportDocx(params: {
  title: string;
  reportData: ReportData;
  sections: SectionRow[];
  screenshots: ScreenshotRow[];
}): Promise<Buffer> {
  const { title, reportData, sections, screenshots } = params;
  const personal = reportData.personal;
  const siwes = reportData.siwes;

  const byKey = (key: string) => sections.find((s) => s.section_key === key)?.content ?? "";
  const chapterNumbers = Array.from(
    new Set(sections.filter((s) => s.chapter_number !== null).map((s) => s.chapter_number!))
  ).sort((a, b) => a - b);

  let figureCounter = 0;
  let tableCounter = 0;
  const screenshotsBySection = new Map<string, ScreenshotRow[]>();
  for (const shot of screenshots) {
    if (!shot.section_id) continue;
    const list = screenshotsBySection.get(shot.section_id) ?? [];
    list.push(shot);
    screenshotsBySection.set(shot.section_id, list);
  }

  const chapterChildren: (Paragraph | Table)[] = [];
  for (const num of chapterNumbers) {
    chapterChildren.push(heading1(CHAPTER_HEADINGS[num] ?? `CHAPTER ${num}`));
    const chapterSections = sections
      .filter((s) => s.chapter_number === num)
      .sort((a, b) => a.order_index - b.order_index);

    for (const section of chapterSections) {
      chapterChildren.push(heading2(section.title));
      chapterChildren.push(...bodyParagraphs(section.content));

      if (section.table_data) {
        tableCounter += 1;
        chapterChildren.push(...tableBlock(section.table_data, tableCounter));
      }

      const shots = screenshotsBySection.get(section.id) ?? [];
      for (const shot of shots) {
        figureCounter += 1;
        chapterChildren.push(...(await screenshotBlock(shot, figureCounter)));
      }
    }
  }

  const listOfFigures =
    screenshots.length > 0
      ? [
          heading1("LIST OF FIGURES"),
          ...screenshots.map(
            (s, i) =>
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: `Figure ${i + 1}: ${s.caption}`, font: FONT, size: BODY_SIZE }),
                ],
              })
          ),
        ]
      : [];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY_SIZE } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })],
              }),
            ],
          }),
        },
        children: [
          // Cover page
          new Paragraph({ spacing: { before: 1200 }, children: [] }),
          centered((personal?.university ?? "").toUpperCase() || "UNIVERSITY", { size: 28, bold: true }),
          centered(personal?.facultySchool ?? "", { size: 24 }),
          centered(personal?.department ?? "", { size: 24 }),
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          centered(title.toUpperCase(), { size: 32, bold: true }),
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          centered("BY"),
          centered(personal?.fullName ?? "", { size: 26, bold: true }),
          centered(personal?.matricNumber ?? ""),
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          centered(
            `Submitted in partial fulfilment of the requirements for the award of ${personal?.programme || "a degree"}`
          ),
          centered(personal?.academicSession ?? ""),
          ...(siwes?.companyName
            ? [
                new Paragraph({ spacing: { before: 400 }, children: [] }),
                centered(`Industrial attachment carried out at ${siwes.companyName}`),
              ]
            : []),

          // Certification
          heading1("CERTIFICATION"),
          ...bodyParagraphs(byKey("certification")),

          // Dedication
          heading1("DEDICATION"),
          ...bodyParagraphs(byKey("dedication")),

          // Acknowledgement
          heading1("ACKNOWLEDGEMENT"),
          ...bodyParagraphs(byKey("acknowledgement")),

          // Abstract
          heading1("ABSTRACT"),
          ...bodyParagraphs(byKey("abstract")),

          // Table of Contents
          heading1("TABLE OF CONTENTS"),
          new TableOfContents("Table of Contents", {
            hyperlink: true,
            headingStyleRange: "1-2",
          }),

          ...listOfFigures,

          // Chapters
          ...chapterChildren,

          // References — AI-drafted citations bounded to the student's named
          // technologies when available, or the student's own edits/the
          // honest placeholder otherwise (see generation.ts; the app never
          // fabricates citations it has no source for).
          heading1("REFERENCES"),
          ...bodyParagraphs(byKey("references") || REFERENCES_FALLBACK),

          // Appendices — always student-editable; no source data exists to
          // draft this from automatically.
          heading1("APPENDICES"),
          ...bodyParagraphs(byKey("appendices") || APPENDICES_FALLBACK),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
