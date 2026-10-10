import { z } from "zod";

/**
 * Server-side environment schema. Imported only from server code (route
 * handlers, server actions, server components) — never bundle this into a
 * client component, since it reads secret keys.
 *
 * Each integration is optional at the schema level so the app keeps running
 * with the relevant feature disabled (clear error surfaced to the user)
 * instead of crashing the whole process when a credential hasn't been
 * supplied yet. See README "Running without credentials".
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  AI_PROVIDER: z.enum(["openai", "gemini", "perplexity"]).default("openai"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  PERPLEXITY_API_KEY: z.string().optional(),
  PERPLEXITY_MODEL: z.string().default("sonar"),

  PAYSTACK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),

  STORAGE_BUCKET: z.string().default("siwes-reports"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `- ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n\nCopy .env.example to .env.local and fill in real values.`
    );
  }

  cached = parsed.data;
  return cached;
}

export function isAiConfigured(env: ServerEnv): boolean {
  if (env.AI_PROVIDER === "openai") return !!env.OPENAI_API_KEY;
  if (env.AI_PROVIDER === "gemini") return !!env.GEMINI_API_KEY;
  return !!env.PERPLEXITY_API_KEY;
}

export function isPaystackConfigured(env: ServerEnv): boolean {
  return !!env.PAYSTACK_SECRET_KEY && !!env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
}
