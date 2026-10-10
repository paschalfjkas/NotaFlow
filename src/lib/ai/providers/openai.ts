import "server-only";
import OpenAI from "openai";
import type { AIProvider } from "@/lib/ai/types";
import { AIGenerationError } from "@/lib/ai/types";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateText({ system, prompt }: { system: string; prompt: string }): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
      });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new AIGenerationError("OpenAI returned an empty completion");
      return text;
    } catch (error) {
      if (error instanceof AIGenerationError) throw error;
      throw new AIGenerationError("OpenAI request failed", error);
    }
  }
}
