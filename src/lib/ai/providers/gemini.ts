import "server-only";
import type { AIProvider } from "@/lib/ai/types";
import { AIGenerationError } from "@/lib/ai/types";

/**
 * Talks to Gemini over its REST API directly (no SDK dependency) — the
 * REST surface is small and stable, and avoids pulling in a second vendor
 * SDK alongside the `openai` package.
 */
export class GeminiProvider implements AIProvider {
  constructor(private apiKey: string, private model: string) {}

  async generateText({ system, prompt }: { system: string; prompt: string }): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: system }] },
          generationConfig: { temperature: 0.6 },
        }),
      });
    } catch (error) {
      throw new AIGenerationError("Could not reach Gemini", error);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AIGenerationError(`Gemini request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new AIGenerationError("Gemini returned an empty completion");
    return text;
  }
}
