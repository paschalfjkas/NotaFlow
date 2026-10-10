import "server-only";
import { getServerEnv, isAiConfigured } from "@/lib/env";
import { OpenAIProvider } from "@/lib/ai/providers/openai";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import { PerplexityProvider } from "@/lib/ai/providers/perplexity";
import type { AIProvider, GenerateJSONParams } from "@/lib/ai/types";
import { AIGenerationError } from "@/lib/ai/types";

export function getAIProvider(): AIProvider {
  const env = getServerEnv();
  if (!isAiConfigured(env)) {
    throw new AIGenerationError(
      "No AI provider is configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or PERPLEXITY_API_KEY (and AI_PROVIDER) in your environment."
    );
  }

  if (env.AI_PROVIDER === "openai") {
    return new OpenAIProvider(env.OPENAI_API_KEY!, env.OPENAI_MODEL);
  }
  if (env.AI_PROVIDER === "gemini") {
    return new GeminiProvider(env.GEMINI_API_KEY!, env.GEMINI_MODEL);
  }
  return new PerplexityProvider(env.PERPLEXITY_API_KEY!, env.PERPLEXITY_MODEL);
}

function extractJSON(text: string): string {
  // Models sometimes wrap JSON in ```json fences despite instructions not to.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

/**
 * Transient, retry-worthy provider errors: 429/rate-limit (quota) and
 * 503/UNAVAILABLE ("model is currently experiencing high demand" — a real,
 * reproducible Gemini response under normal load, not a quota issue) both
 * mean "the same request will probably succeed moments later," unlike a
 * validation or auth error which won't.
 */
function isRetryableProviderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|RESOURCE_EXHAUSTED|rate.?limit|503|UNAVAILABLE|overloaded|high demand/i.test(
    message
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Many free-tier API keys cap requests at just a handful per minute, and
 * shared-capacity models occasionally return a transient 503 under load —
 * even with the pipeline calling chapters sequentially (see pipeline.ts), a
 * single request can still land mid-window or hit a busy moment. This
 * retries on both (see isRetryableProviderError) with a backoff long enough
 * to clear a per-minute quota or a short-lived overload, separate from the
 * JSON-validation retry below.
 */
async function generateTextWithRetry(
  provider: AIProvider,
  params: { system: string; prompt: string }
): Promise<string> {
  const backoffsMs = [15_000, 30_000, 30_000];

  for (let attempt = 0; ; attempt++) {
    try {
      return await provider.generateText(params);
    } catch (error) {
      if (!isRetryableProviderError(error) || attempt >= backoffsMs.length) throw error;
      await sleep(backoffsMs[attempt]);
    }
  }
}

/**
 * Calls the provider for raw text, then parses + validates it against
 * `schema`. On a validation failure, retries once with the validation
 * errors fed back to the model so it can correct its own output.
 */
export async function generateValidatedJSON<T>(
  provider: AIProvider,
  { system, prompt, schema, label }: GenerateJSONParams<T>
): Promise<T> {
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const effectivePrompt =
      attempt === 0
        ? prompt
        : `${prompt}\n\nYour previous response failed validation with this error:\n${lastError}\n\nReturn ONLY corrected JSON matching the required shape — no commentary, no markdown fences.`;

    const text = await generateTextWithRetry(provider, { system, prompt: effectivePrompt });

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJSON(text));
    } catch {
      lastError = "Response was not valid JSON.";
      continue;
    }

    const result = schema.safeParse(parsed);
    if (result.success) return result.data;

    lastError = result.error.issues
      .map((i) => `- ${i.path.join(".")}: ${i.message}`)
      .join("\n");
  }

  throw new AIGenerationError(
    `AI output for "${label}" failed validation after retrying: ${lastError}`
  );
}
