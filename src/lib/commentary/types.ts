export const COMMENTARY_SPEAKERS = [
  "play_by_play",
  "color",
  "stats_desk",
  "field_reporter",
] as const;

export type CommentarySpeaker = (typeof COMMENTARY_SPEAKERS)[number];
export type CommentaryTone = "clean" | "mildly_irreverent";

export type CommentaryRouteFacts = {
  name: string;
  distanceMeters: number;
  durationSeconds: number | null;
  elevationGainMeters: number | null;
  averagePaceSecondsPerKilometer: number | null;
  highestElevationMeters: number | null;
  lowestElevationMeters: number | null;
};

export type CommentaryEventFact = {
  id: string;
  type: string;
  routeProgress: number;
  distanceMeters: number;
  elapsedSeconds: number | null;
  metrics: Record<string, number>;
  importance: number;
};

/** Deliberately cannot represent route geometry, coordinates, or raw samples. */
export type CommentaryGenerationInput = {
  routeId: string;
  facts: CommentaryRouteFacts;
  events: CommentaryEventFact[];
  tone?: CommentaryTone;
};

export type GeneratedCommentaryLine = {
  eventId: string;
  speaker: CommentarySpeaker;
  text: string;
  importance: number;
};

export type CommentaryPackage = {
  schemaVersion: 1;
  routeId: string;
  tone: CommentaryTone;
  opening: string;
  lines: GeneratedCommentaryLine[];
  finishRecap: string;
};

export type CommentaryUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type CommentaryGenerationResult = {
  package: CommentaryPackage;
  usage?: CommentaryUsage;
};

export interface CommentaryStore {
  save(routeId: string, commentary: CommentaryPackage): Promise<void>;
  load(routeId: string): Promise<CommentaryPackage | null>;
}
