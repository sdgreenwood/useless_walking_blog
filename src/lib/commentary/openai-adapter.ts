import "server-only";

import { parseCommentaryPackage } from "./schema";
import type {
  CommentaryGenerationInput,
  CommentaryGenerationResult,
  CommentaryTone,
  CommentaryUsage,
} from "./types";

export type CommentaryLogger = (event: {
  routeId: string;
  model: string;
  usage?: CommentaryUsage;
}) => void;

export type OpenAICommentaryOptions = {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  fetch?: typeof globalThis.fetch;
  log?: CommentaryLogger;
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["opening", "lines", "finishRecap"],
  properties: {
    opening: { type: "string", maxLength: 400 },
    lines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["eventId", "speaker", "text", "importance"],
        properties: {
          eventId: { type: "string" },
          speaker: { enum: ["play_by_play", "color", "stats_desk", "field_reporter"] },
          text: { type: "string", maxLength: 320 },
          importance: { type: "integer", minimum: 1, maximum: 3 },
        },
      },
    },
    finishRecap: { type: "string", maxLength: 500 },
  },
} as const;

function buildPrompt(input: CommentaryGenerationInput, tone: CommentaryTone) {
  // Explicit projection is the privacy boundary. Do not replace with spreading input.
  return JSON.stringify({
    tone,
    facts: {
      name: input.facts.name,
      distanceMeters: input.facts.distanceMeters,
      durationSeconds: input.facts.durationSeconds,
      elevationGainMeters: input.facts.elevationGainMeters,
      averagePaceSecondsPerKilometer: input.facts.averagePaceSecondsPerKilometer,
      highestElevationMeters: input.facts.highestElevationMeters,
      lowestElevationMeters: input.facts.lowestElevationMeters,
    },
    events: input.events.map((event) => ({
      id: event.id,
      type: event.type,
      routeProgress: event.routeProgress,
      distanceMeters: event.distanceMeters,
      elapsedSeconds: event.elapsedSeconds,
      metrics: event.metrics,
      importance: event.importance,
    })),
  });
}

function responseText(body: Record<string, unknown>): string | null {
  if (typeof body.output_text === "string") return body.output_text;
  const output = Array.isArray(body.output) ? body.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return null;
}

function usage(body: Record<string, unknown>): CommentaryUsage | undefined {
  const raw = body.usage;
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  return {
    inputTokens: typeof value.input_tokens === "number" ? value.input_tokens : undefined,
    outputTokens: typeof value.output_tokens === "number" ? value.output_tokens : undefined,
    totalTokens: typeof value.total_tokens === "number" ? value.total_tokens : undefined,
  };
}

export async function generateCommentary(
  input: CommentaryGenerationInput,
  options: OpenAICommentaryOptions = {},
): Promise<CommentaryGenerationResult> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const model = options.model ?? process.env.OPENAI_COMMENTARY_MODEL ?? "gpt-5-mini";
  const tone = input.tone ?? "mildly_irreverent";
  const fetcher = options.fetch ?? globalThis.fetch;
  const attempts = Math.max(1, Math.min(options.maxAttempts ?? 2, 2));
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
    try {
      const response = await fetcher("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          instructions:
            "Create concise sports-broadcast commentary using only supplied facts. Never infer places, weather, identity, or route facts. Include at most one line per event and cover the finish event when present.",
          input: buildPrompt(input, tone),
          text: { format: { type: "json_schema", name: "commentary_package", strict: true, schema: responseSchema } },
        }),
      });
      if (!response.ok) throw new Error(`OpenAI commentary request failed (${response.status})`);
      const body = (await response.json()) as Record<string, unknown>;
      const rawText = responseText(body);
      if (!rawText) throw new Error("OpenAI commentary response contained no text");
      const parsed = parseCommentaryPackage(
        JSON.parse(rawText) as unknown,
        input.routeId,
        tone,
        new Set(input.events.map((event) => event.id)),
      );
      const tokenUsage = usage(body);
      options.log?.({ routeId: input.routeId, model, usage: tokenUsage });
      return { package: parsed, usage: tokenUsage };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Commentary generation failed");
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError ?? new Error("Commentary generation failed");
}
