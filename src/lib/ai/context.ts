import type { ReportData } from "@/lib/validation/wizard";
import {
  REPORT_LENGTH_LABELS,
  WRITING_STYLE_LABELS,
} from "@/lib/validation/wizard";

const NOT_PROVIDED = "Not provided — do not invent this; use \"To be confirmed\" if the report needs to reference it.";

function fact(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : NOT_PROVIDED;
}

function list(values: string[] | undefined): string {
  return values && values.length > 0 ? values.join(", ") : "Not provided";
}

/**
 * Flattens the wizard's `report_data` into a single plain-text brief the AI
 * prompts can quote from directly. Every field passes through `fact()` so
 * blanks are explicit ("Not provided…") rather than silently empty strings
 * an LLM might paper over by guessing.
 */
export function buildReportContext(data: ReportData): string {
  const personal = data.personal;
  const siwes = data.siwes;
  const company = data.company;
  const experience = data.experience;
  const technologies = data.technologies;
  const challenges = data.challenges;
  const preferences = data.preferences;

  const projects = (experience?.projects ?? [])
    .map(
      (p, i) => `  Project ${i + 1}: ${p.projectName || "Untitled"}
    Description: ${fact(p.description)}
    Technologies: ${fact(p.technologies)}
    Role: ${fact(p.role)}
    What they learned: ${fact(p.learnings)}`
    )
    .join("\n\n");

  return `
STUDENT
  Full name: ${fact(personal?.fullName)}
  University: ${fact(personal?.university)}
  Faculty/School: ${fact(personal?.facultySchool)}
  Department: ${fact(personal?.department)}
  Programme: ${fact(personal?.programme)}
  Academic session: ${fact(personal?.academicSession)}

SIWES PLACEMENT
  Company/organisation: ${fact(siwes?.companyName)}
  Company address: ${fact(siwes?.companyAddress)}
  Duration: ${fact(siwes?.duration)}
  Department/team: ${fact(siwes?.departmentTeam)}
  Industrial supervisor: ${fact(siwes?.industrialSupervisor)}
  Institutional supervisor: ${fact(siwes?.institutionalSupervisor)}
  Head of Department: ${fact(siwes?.headOfDepartment)}

COMPANY INFORMATION
  ${
    company?.dontKnow
      ? "The student does not know this company's details — do not invent any company facts, history, mission, vision, or statistics."
      : `What the company does: ${fact(company?.whatCompanyDoes)}
  Industry: ${fact(company?.industry)}
  Products/services: ${fact(company?.productsServices)}
  Mission: ${fact(company?.mission)}
  Vision: ${fact(company?.vision)}
  Core values: ${fact(company?.coreValues)}
  Departments: ${fact(company?.departments)}
  Team worked with: ${fact(company?.teamWorkedWith)}
  Company size: ${fact(company?.companySize)}`
  }

PROJECTS
${projects || "  None provided."}

TASKS PERFORMED
  ${list(experience?.tasks)}

TOOLS AND TECHNOLOGIES USED
  ${list(technologies?.technologies)}

CHALLENGES AND LEARNING
  Biggest challenge: ${fact(challenges?.biggestChallenge)}
  How they solved it: ${fact(challenges?.howSolved)}
  Technical skills gained: ${list(challenges?.technicalSkills)}
  Professional skills gained: ${list(challenges?.professionalSkills)}
  Most important thing learned: ${fact(challenges?.mostImportantLearning)}

REPORT PREFERENCES
  Length: ${preferences?.reportLength ? REPORT_LENGTH_LABELS[preferences.reportLength] : "Standard"}
  Writing style: ${preferences?.writingStyle ? WRITING_STYLE_LABELS[preferences.writingStyle] : "Professional and natural"}
`.trim();
}
