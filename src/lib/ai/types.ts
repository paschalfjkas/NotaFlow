import "server-only";
import type { ZodType } from "zod";

export interface GenerateJSONParams<T> {
  system: string;
  prompt: string;
  schema: ZodType<T>;
  /** Short label used only in error messages/logs, e.g. "chapter_three". */
  label: string;
}

/**
 * Provider abstraction so the app isn't tightly coupled to one AI vendor
 * (product spec section 42). Implementations must return JSON that
 * validates against `schema` — see `generateValidatedJSON` in `index.ts`
 * for the shared retry-on-validation-failure logic.
 */
export interface AIProvider {
  /** Returns the raw text completion for the given prompt (no JSON parsing). */
  generateText(params: { system: string; prompt: string }): Promise<string>;
}

export class AIGenerationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "AIGenerationError";
  }
}
