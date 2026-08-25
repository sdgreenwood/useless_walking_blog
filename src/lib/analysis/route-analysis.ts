import type { Coordinate } from "../replay-types";
import type { NormalizedRoute, NormalizedRouteSample } from "../domain/normalized-route";

export const ROUTE_ANALYSIS_VERSION = 1;

export type AnalysisQualityFlag = {
  code: "too_few_samples" | "missing_time" | "missing_elevation" | "duplicate_points" | "gps_jump" | "sparse_samples" | "elevation_spike";
  count: number;
};

export type AnalyzedSample = {
  segmentIndex: number;
  sequence: number;
  coordinates: Coordinate;
  elapsedSeconds: number | null;
  elevationMeters: number | null;
  smoothedElevationMeters: number | null;
  distanceMeters: number;
  progress: number;
  speedMetersPerSecond: number | null;
  gradePercent: number | null;
};

export type AnalysisEvent = {
  id: string;
  type: "start" | "finish" | "halfway" | "distance_milestone" | "high_point" | "low_point" | "climb" | "descent" | "fastest_section" | "quality";
  reason: string;
  routeProgress: number;
  distanceMeters: number;
  elapsedSeconds: number | null;
  coordinates: Coordinate;
  metrics: Record<string, number>;
  importance: number;
};

export type RouteAnalysis = {
  version: 1;
  samples: AnalyzedSample[];
  statistics: {
    distanceMeters: number;
    durationSeconds: number | null;
    movingTimeSeconds: number | null;
    averageSpeedMetersPerSecond: number | null;
    elevationGainMeters: number | null;
    elevationLossMeters: number | null;
    highestElevationMeters: number | null;
    lowestElevationMeters: number | null;
    steepestGradePercent: number | null;
    longestClimbMeters: number;
    sampleCount: number;
  };
  quality: AnalysisQualityFlag[];
  events: AnalysisEvent[];
};

type Working = AnalyzedSample & { source: NormalizedRouteSample };

export function analyzeRoute(route: NormalizedRoute): RouteAnalysis {
  const quality = new Map<AnalysisQualityFlag["code"], number>();
  const addFlag = (code: AnalysisQualityFlag["code"]) => quality.set(code, (quality.get(code) ?? 0) + 1);
  const working: Working[] = [];
  let totalDistance = 0;
  let duplicateCount = 0;
  let jumpCount = 0;
  let sparseCount = 0;

  for (const segment of route.segments) {
    let previous: Working | null = null;
    for (const source of segment.samples) {
      let speed: number | null = null;
      if (previous) {
        const deltaDistance = haversine(previous.coordinates, source.coordinates);
        totalDistance += deltaDistance;
        if (deltaDistance < 0.75) duplicateCount += 1;
        const dt = source.elapsedSeconds !== null && previous.elapsedSeconds !== null ? source.elapsedSeconds - previous.elapsedSeconds : null;
        if (dt !== null && dt > 0) {
          speed = deltaDistance / dt;
          if (speed > 12) jumpCount += 1;
          if (dt > 120) sparseCount += 1;
        } else if (deltaDistance > 0) {
          speed = null;
        }
      }
      const item: Working = {
        source,
        segmentIndex: segment.index,
        sequence: source.sequence,
        coordinates: source.coordinates,
        elapsedSeconds: source.elapsedSeconds,
        elevationMeters: source.elevationMeters,
        smoothedElevationMeters: null,
        distanceMeters: totalDistance,
        progress: 0,
        speedMetersPerSecond: speed,
        gradePercent: null
      };
      working.push(item);
      previous = item;
    }
  }

  if (working.length < 2) addFlag("too_few_samples");
  if (working.some((sample) => sample.elapsedSeconds === null)) addFlag("missing_time");
  if (working.some((sample) => sample.elevationMeters === null)) addFlag("missing_elevation");
  if (duplicateCount) quality.set("duplicate_points", duplicateCount);
  if (jumpCount) quality.set("gps_jump", jumpCount);
  if (sparseCount) quality.set("sparse_samples", sparseCount);

  const elevations = working.map((sample, index) => medianWindow(working, index));
  working.forEach((sample, index) => {
    sample.progress = totalDistance > 0 ? sample.distanceMeters / totalDistance : working.length > 1 ? index / (working.length - 1) : 0;
    sample.smoothedElevationMeters = elevations[index];
    if (index > 0 && sample.segmentIndex === working[index - 1].segmentIndex && elevations[index] !== null && elevations[index - 1] !== null) {
      const rise = elevations[index]! - elevations[index - 1]!;
      const run = sample.distanceMeters - working[index - 1].distanceMeters;
      sample.gradePercent = run >= 5 ? clamp((rise / run) * 100, -35, 35) : null;
      const previousElevation = working[index - 1].elevationMeters;
      const rawRise = sample.elevationMeters !== null && previousElevation !== null ? sample.elevationMeters - previousElevation : 0;
      if (Math.abs(rawRise) > 25 && run < 50) addFlag("elevation_spike");
    }
  });

  const elevationValues = elevations.filter((value): value is number => value !== null);
  let gain = 0;
  let loss = 0;
  let currentClimbStart = 0;
  let longestClimb = 0;
  for (let index = 1; index < working.length; index += 1) {
    if (working[index].segmentIndex !== working[index - 1].segmentIndex) {
      currentClimbStart = index;
      continue;
    }
    if (elevations[index] === null || elevations[index - 1] === null) continue;
    const delta = elevations[index]! - elevations[index - 1]!;
    if (delta >= 1) gain += delta;
    if (delta <= -1) loss += -delta;
    if (delta > 0) longestClimb = Math.max(longestClimb, working[index].distanceMeters - working[currentClimbStart].distanceMeters);
    else if (delta < -0.5) currentClimbStart = index;
  }

  const times = working.map((sample) => sample.elapsedSeconds).filter((value): value is number => value !== null);
  const duration = route.durationSeconds ?? (times.length > 1 ? Math.max(...times) - Math.min(...times) : null);
  const validSpeeds = working.map((sample) => sample.speedMetersPerSecond).filter((value): value is number => value !== null && value <= 12);
  const movingTime = duration === null ? null : duration;
  const statistics: RouteAnalysis["statistics"] = {
    distanceMeters: totalDistance,
    durationSeconds: duration,
    movingTimeSeconds: movingTime,
    averageSpeedMetersPerSecond: duration !== null && duration > 0 ? totalDistance / duration : null,
    elevationGainMeters: elevationValues.length ? gain : null,
    elevationLossMeters: elevationValues.length ? loss : null,
    highestElevationMeters: elevationValues.length ? Math.max(...elevationValues) : null,
    lowestElevationMeters: elevationValues.length ? Math.min(...elevationValues) : null,
    steepestGradePercent: working.map((sample) => sample.gradePercent).filter((value): value is number => value !== null).reduce<number | null>((best, value) => best === null || Math.abs(value) > Math.abs(best) ? value : best, null),
    longestClimbMeters: longestClimb,
    sampleCount: working.length
  };
  const qualityList = [...quality].map(([code, count]) => ({ code, count })).sort((a, b) => a.code.localeCompare(b.code));
  const samples = working.map((sample) => {
    const { source, ...analyzed } = sample;
    void source;
    return analyzed;
  });
  return { version: ROUTE_ANALYSIS_VERSION, samples, statistics, quality: qualityList, events: buildEvents(working, statistics, qualityList, validSpeeds) };
}

function buildEvents(samples: Working[], stats: RouteAnalysis["statistics"], quality: AnalysisQualityFlag[], speeds: number[]): AnalysisEvent[] {
  if (!samples.length) return [];
  const candidates: Array<Omit<AnalysisEvent, "id">> = [];
  const add = (type: AnalysisEvent["type"], sample: Working, reason: string, importance: number, metrics: Record<string, number> = {}) => candidates.push({ type, reason, routeProgress: sample.progress, distanceMeters: sample.distanceMeters, elapsedSeconds: sample.elapsedSeconds, coordinates: sample.coordinates, metrics, importance });
  add("start", samples[0], "route_start", 100);
  if (stats.distanceMeters > 0) {
    const interval = stats.distanceMeters < 3000 ? 500 : stats.distanceMeters < 15000 ? 1000 : 5000;
    for (let meters = interval; meters < stats.distanceMeters - interval * 0.25; meters += interval) add("distance_milestone", nearestDistance(samples, meters), "distance_threshold", 45, { milestoneMeters: meters });
    add("halfway", nearestProgress(samples, 0.5), "half_distance", 70, { halfwayMeters: stats.distanceMeters / 2 });
  }
  const elevated = samples.filter((sample) => sample.smoothedElevationMeters !== null);
  if (elevated.length >= 3) {
    const high = elevated.reduce((a, b) => a.smoothedElevationMeters! >= b.smoothedElevationMeters! ? a : b);
    const low = elevated.reduce((a, b) => a.smoothedElevationMeters! <= b.smoothedElevationMeters! ? a : b);
    add("high_point", high, "maximum_smoothed_elevation", 65, { elevationMeters: high.smoothedElevationMeters! });
    add("low_point", low, "minimum_smoothed_elevation", 50, { elevationMeters: low.smoothedElevationMeters! });
    addTrendEvents(samples, add);
  }
  if (speeds.length >= 2) {
    const fastest = samples.filter((sample) => sample.speedMetersPerSecond !== null && sample.speedMetersPerSecond <= 12).reduce((a, b) => a.speedMetersPerSecond! >= b.speedMetersPerSecond! ? a : b);
    add("fastest_section", fastest, "maximum_valid_sample_speed", 55, { speedMetersPerSecond: fastest.speedMetersPerSecond! });
  }
  if (quality.length) add("quality", samples[0], "route_quality_flags", 25, { flagCount: quality.length });
  add("finish", samples.at(-1)!, "route_finish", 100, { distanceMeters: stats.distanceMeters });

  const ordered = candidates.sort((a, b) => a.routeProgress - b.routeProgress || b.importance - a.importance);
  const deduped = ordered.filter((event, index) => event.importance >= 60 || !ordered.slice(0, index).some((other) => Math.abs(other.routeProgress - event.routeProgress) < 0.015 && other.importance >= event.importance));
  const capped = capEvents(deduped, stats.distanceMeters > 15000 ? 60 : stats.distanceMeters > 3000 ? 40 : 25);
  return capped.map((event, index) => ({ ...event, id: `analysis-v1-${String(index + 1).padStart(3, "0")}-${event.type}` }));
}

function addTrendEvents(samples: Working[], add: (type: AnalysisEvent["type"], sample: Working, reason: string, importance: number, metrics?: Record<string, number>) => void): void {
  let segmentStart = 0;
  for (let index = 1; index <= samples.length; index += 1) {
    if (index === samples.length || samples[index].segmentIndex !== samples[index - 1].segmentIndex) {
      addSegmentTrendEvents(samples.slice(segmentStart, index), add);
      segmentStart = index;
    }
  }
}

function addSegmentTrendEvents(samples: Working[], add: (type: AnalysisEvent["type"], sample: Working, reason: string, importance: number, metrics?: Record<string, number>) => void): void {
  if (samples.length < 2) return;
  let start = 0;
  let direction = 0;
  for (let index = 1; index <= samples.length; index += 1) {
    const delta = index < samples.length && samples[index].smoothedElevationMeters !== null && samples[index - 1].smoothedElevationMeters !== null ? samples[index].smoothedElevationMeters! - samples[index - 1].smoothedElevationMeters! : 0;
    const nextDirection = delta > 0.5 ? 1 : delta < -0.5 ? -1 : 0;
    if (direction === 0 && nextDirection !== 0) { start = index - 1; direction = nextDirection; continue; }
    if (direction !== 0 && nextDirection === 0 && index < samples.length) continue;
    if (direction !== 0 && nextDirection !== direction) {
      const end = index - 1;
      const vertical = samples[end].smoothedElevationMeters! - samples[start].smoothedElevationMeters!;
      const distance = samples[end].distanceMeters - samples[start].distanceMeters;
      if (distance >= 100 && Math.abs(vertical) >= 8) add(direction > 0 ? "climb" : "descent", samples[end], direction > 0 ? "sustained_elevation_gain" : "sustained_elevation_loss", 60, { distanceMeters: distance, verticalMeters: Math.abs(vertical) });
      start = Math.max(0, index - 1);
      direction = nextDirection;
    }
  }
}

function capEvents(events: Array<Omit<AnalysisEvent, "id">>, max: number): Array<Omit<AnalysisEvent, "id">> {
  if (events.length <= max) return events;
  const retained = [...events].sort((a, b) => b.importance - a.importance).slice(0, max);
  return retained.sort((a, b) => a.routeProgress - b.routeProgress || b.importance - a.importance);
}

function nearestDistance(samples: Working[], target: number): Working { return samples.reduce((a, b) => Math.abs(a.distanceMeters - target) <= Math.abs(b.distanceMeters - target) ? a : b); }
function nearestProgress(samples: Working[], target: number): Working { return samples.reduce((a, b) => Math.abs(a.progress - target) <= Math.abs(b.progress - target) ? a : b); }
function medianWindow(samples: Working[], index: number): number | null {
  const values = samples.slice(Math.max(0, index - 2), index + 3).filter((sample) => sample.segmentIndex === samples[index].segmentIndex).map((sample) => sample.elevationMeters).filter((value): value is number => value !== null).sort((a, b) => a - b);
  return values.length >= 2 || (values.length === 1 && samples.length === 1) ? values[Math.floor(values.length / 2)] : null;
}
function clamp(value: number, low: number, high: number): number { return Math.min(high, Math.max(low, value)); }
function haversine(a: Coordinate, b: Coordinate): number {
  const radians = Math.PI / 180;
  const dLat = (b[1] - a[1]) * radians;
  const dLon = (b[0] - a[0]) * radians;
  const lat1 = a[1] * radians;
  const lat2 = b[1] * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6_371_008.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
