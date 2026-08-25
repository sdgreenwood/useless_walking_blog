import { analyzeRoute, type AnalysisEvent, type RouteAnalysis } from "../analysis/route-analysis";
import type { NormalizedRoute } from "../domain/normalized-route";
import type { CommentaryPackage } from "../commentary/types";
import type { Commentary, ReplayDocument, RouteEvent } from "../replay-types";

export type ReplayBuildOptions = {
  id: string;
  name: string;
  createdAt?: string;
  trimStartMeters?: number;
  trimEndMeters?: number;
  commentary?: CommentaryPackage;
};

export type ReplayBuildResult = {
  replay: ReplayDocument;
  privacy: {
    trimStartMeters: number;
    trimEndMeters: number;
    originalSampleCount: number;
    publishedSampleCount: number;
  };
  quality: RouteAnalysis["quality"];
};

export function buildReplay(normalized: NormalizedRoute, options: ReplayBuildOptions): ReplayBuildResult {
  validateId(options.id);
  if (normalized.segments.filter((segment) => segment.samples.length > 0).length !== 1) {
    throw new Error("V1 publication requires exactly one contiguous route segment; separate fragments cannot be joined safely.");
  }
  const trimStartMeters = nonNegative(options.trimStartMeters ?? 200, "trimStartMeters");
  const trimEndMeters = nonNegative(options.trimEndMeters ?? 200, "trimEndMeters");
  const originalSampleCount = normalized.segments.reduce((total, segment) => total + segment.samples.length, 0);
  const trimmed = trimRoute(normalized, trimStartMeters, trimEndMeters);
  const analysis = analyzeRoute(trimmed);
  if (analysis.samples.length < 2 || analysis.statistics.distanceMeters <= 0) {
    throw new Error("Published route must contain at least two distinct samples.");
  }

  const events = analysis.events.map(toReplayEvent);
  const routeStart = events.find((event) => event.type === "route_start") ?? events[0];
  const routeFinish = [...events].reverse().find((event) => event.type === "finish") ?? events.at(-1)!;
  const commentary = options.commentary
    ? fromGeneratedCommentary(options.commentary, routeStart.id, routeFinish.id)
    : deterministicCommentary(events, analysis);
  const duration = analysis.statistics.durationSeconds;
  const averagePace = duration !== null && analysis.statistics.distanceMeters > 0
    ? duration / (analysis.statistics.distanceMeters / 1000)
    : null;

  return {
    replay: {
      schemaVersion: 1,
      route: {
        id: options.id,
        name: options.name.trim() || options.id,
        createdAt: options.createdAt ?? new Date().toISOString(),
        source: normalized.source.kind,
        geometry: { type: "LineString", coordinates: analysis.samples.map((sample) => sample.coordinates) },
        samples: analysis.samples.map((sample) => ({
          progress: sample.progress,
          distanceMeters: sample.distanceMeters,
          elapsedSeconds: sample.elapsedSeconds,
          coordinates: sample.coordinates,
          elevationMeters: sample.smoothedElevationMeters,
          gradePercent: sample.gradePercent
        })),
        distanceMeters: analysis.statistics.distanceMeters,
        elevationGainMeters: analysis.statistics.elevationGainMeters,
        durationSeconds: duration,
        stats: {
          averagePaceSecondsPerKilometer: averagePace,
          highestElevationMeters: analysis.statistics.highestElevationMeters,
          lowestElevationMeters: analysis.statistics.lowestElevationMeters,
          steepestGradePercent: analysis.statistics.steepestGradePercent,
          longestClimbMeters: analysis.statistics.longestClimbMeters,
          sampleCount: analysis.statistics.sampleCount
        },
        events,
        commentary
      }
    },
    privacy: {
      trimStartMeters,
      trimEndMeters,
      originalSampleCount,
      publishedSampleCount: analysis.samples.length
    },
    quality: analysis.quality
  };
}

function trimRoute(route: NormalizedRoute, startMeters: number, endMeters: number): NormalizedRoute {
  const preliminary = analyzeRoute(route);
  const total = preliminary.statistics.distanceMeters;
  if (startMeters + endMeters >= total) {
    throw new Error(`Privacy trimming (${startMeters + endMeters} m) removes the entire ${Math.round(total)} m route.`);
  }
  const distances = new Map(preliminary.samples.map((sample) => [`${sample.segmentIndex}:${sample.sequence}`, sample.distanceMeters]));
  let firstElapsed: number | null = null;
  const segments = route.segments.map((segment) => ({
    index: segment.index,
    samples: segment.samples.filter((sample) => {
      const distance = distances.get(`${segment.index}:${sample.sequence}`);
      return distance !== undefined && distance >= startMeters && distance <= total - endMeters;
    }).map((sample) => {
      firstElapsed ??= sample.elapsedSeconds;
      return { ...sample, elapsedSeconds: sample.elapsedSeconds !== null && firstElapsed !== null ? sample.elapsedSeconds - firstElapsed : null };
    })
  })).filter((segment) => segment.samples.length > 0);
  const elapsed = segments.flatMap((segment) => segment.samples.map((sample) => sample.elapsedSeconds)).filter((value): value is number => value !== null);
  return {
    ...route,
    durationSeconds: elapsed.length ? Math.max(...elapsed) : null,
    segments
  };
}

function toReplayEvent(event: AnalysisEvent): RouteEvent {
  const type = event.type === "start" ? "route_start" : event.type;
  return {
    id: event.id,
    type,
    routeProgress: event.routeProgress,
    distanceMeters: event.distanceMeters,
    elapsedSeconds: event.elapsedSeconds,
    coordinates: event.coordinates,
    metrics: event.metrics,
    importance: Math.max(1, Math.min(3, Math.round(event.importance / 35)))
  };
}

function fromGeneratedCommentary(commentary: CommentaryPackage, startId: string, finishId: string): Commentary[] {
  return [
    { eventId: startId, speaker: "play_by_play", text: commentary.opening, importance: 3, source: "openai" },
    ...commentary.lines.map((line) => ({ ...line, source: "openai" as const })),
    { eventId: finishId, speaker: "play_by_play", text: commentary.finishRecap, importance: 3, source: "openai" }
  ];
}

function deterministicCommentary(events: RouteEvent[], analysis: RouteAnalysis): Commentary[] {
  return events.filter((event) => event.importance >= 2).map((event, index) => ({
    eventId: event.id,
    speaker: (["play_by_play", "color", "stats_desk", "field_reporter"] as const)[index % 4],
    text: deterministicLine(event, analysis),
    importance: event.importance,
    source: "deterministic" as const
  }));
}

function deterministicLine(event: RouteEvent, analysis: RouteAnalysis): string {
  switch (event.type) {
    case "route_start": return `Coverage is underway with ${formatKm(analysis.statistics.distanceMeters)} kilometers of walking now officially on the record.`;
    case "finish": return "The route is complete. Officials can confirm that continued walking is no longer required.";
    case "halfway": return "Halfway has arrived, making the remaining distance exactly as real as the distance already discussed.";
    case "climb": return `A sustained climb develops over ${Math.round(event.metrics.distanceMeters ?? 0)} meters. Tactical options remain limited.`;
    case "descent": return "The route turns downhill, returning previously acquired elevation to the course.";
    case "high_point": return `The broadcast reaches its verified high point at ${Math.round(event.metrics.elevationMeters ?? 0)} meters.`;
    case "fastest_section": return "The fastest verified section is on the board. The replay desk is declining to call it a sprint.";
    case "distance_milestone": return `${formatKm(event.metrics.milestoneMeters ?? event.distanceMeters)} kilometers completed with professional composure.`;
    default: return "A statistically defensible route development has occurred.";
  }
}

function formatKm(meters: number): string { return (meters / 1000).toFixed(2); }
function nonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative number.`);
  return value;
}
function validateId(id: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("Replay id must be lowercase kebab-case.");
}
