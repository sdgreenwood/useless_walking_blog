import type { Commentary, ReplayRoute, RouteSample } from "./replay-types";

export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function sampleAtProgress(samples: RouteSample[], progress: number): RouteSample {
  const target = clampProgress(progress);
  const upperIndex = samples.findIndex((sample) => sample.progress >= target);

  if (upperIndex <= 0) return samples[0];
  if (upperIndex === -1) return samples[samples.length - 1];

  const lower = samples[upperIndex - 1];
  const upper = samples[upperIndex];
  const span = upper.progress - lower.progress;
  const ratio = span === 0 ? 0 : (target - lower.progress) / span;
  const mix = (a: number, b: number) => a + (b - a) * ratio;
  const mixOptional = (a: number | null, b: number | null) => a !== null && b !== null ? mix(a, b) : a ?? b;

  return {
    progress: target,
    distanceMeters: mix(lower.distanceMeters, upper.distanceMeters),
    elapsedSeconds: mixOptional(lower.elapsedSeconds, upper.elapsedSeconds),
    coordinates: [
      mix(lower.coordinates[0], upper.coordinates[0]),
      mix(lower.coordinates[1], upper.coordinates[1])
    ],
    elevationMeters: mixOptional(lower.elevationMeters, upper.elevationMeters),
    gradePercent: mixOptional(lower.gradePercent, upper.gradePercent)
  };
}

export function visibleCommentary(route: ReplayRoute, progress: number): Commentary[] {
  const eventProgress = new Map(route.events.map((event) => [event.id, event.routeProgress]));
  return route.commentary.filter((line) => (eventProgress.get(line.eventId) ?? 2) <= progress);
}

export function formatClock(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  return `${minutes}:${String(rounded % 60).padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
}
