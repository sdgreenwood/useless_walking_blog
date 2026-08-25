import "server-only";

import { generateCommentary, type OpenAICommentaryOptions } from "./openai-adapter";
import type { CommentaryGenerationInput, CommentaryPackage, CommentaryStore } from "./types";

export async function generateAndStoreCommentary(
  input: CommentaryGenerationInput,
  store: CommentaryStore,
  options?: OpenAICommentaryOptions,
): Promise<CommentaryPackage> {
  const existing = await store.load(input.routeId);
  if (existing) return existing;
  const generated = await generateCommentary(input, options);
  await store.save(input.routeId, generated.package);
  return generated.package;
}

/** Public replay reads only persisted output and cannot trigger generation. */
export function loadStoredCommentary(
  routeId: string,
  store: CommentaryStore,
): Promise<CommentaryPackage | null> {
  return store.load(routeId);
}
