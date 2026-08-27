import { analyzeRoute } from "../analysis/route-analysis";
import type { NormalizedRoute } from "../domain/normalized-route";
import type { ReplayDocument } from "../replay-types";

export function applyDemElevation(
  replay: ReplayDocument,
  elevations: number[],
  provenance: { dataset: string; attribution: string; sampledAt: string; zoom: number }
): ReplayDocument {
  if (elevations.length !== replay.route.samples.length || elevations.some((value) => !Number.isFinite(value))) {
    throw new Error("DEM elevation profile must contain one finite value per replay sample.");
  }
  const normalized: NormalizedRoute = {
    schemaVersion: 1,
    source: { kind: "simulation", schemaVersion: 1 },
    activityType: "random_walk_simulation",
    durationSeconds: replay.route.durationSeconds,
    segments: [{
      index: 0,
      samples: replay.route.samples.map((sample, index) => ({
        sequence: index,
        elapsedSeconds: sample.elapsedSeconds,
        coordinates: sample.coordinates,
        elevationMeters: elevations[index],
        horizontalAccuracyMeters: null,
        verticalAccuracyMeters: null
      }))
    }],
    issues: []
  };
  const analysis = analyzeRoute(normalized);
  const next = structuredClone(replay);
  next.route.samples = next.route.samples.map((sample, index) => ({
    ...sample,
    elevationMeters: analysis.samples[index].smoothedElevationMeters,
    gradePercent: analysis.samples[index].gradePercent
  }));
  next.route.elevationGainMeters = analysis.statistics.elevationGainMeters;
  next.route.elevationSource = { kind: "terrarium-dem", ...provenance };
  next.route.stats.highestElevationMeters = analysis.statistics.highestElevationMeters;
  next.route.stats.lowestElevationMeters = analysis.statistics.lowestElevationMeters;
  next.route.stats.steepestGradePercent = analysis.statistics.steepestGradePercent;
  next.route.stats.longestClimbMeters = analysis.statistics.longestClimbMeters;
  next.route.events = next.route.events.map((event) => {
    const sample = nearestProgress(next.route.samples, event.routeProgress);
    return {
      ...event,
      metrics: {
        ...event.metrics,
        ...(sample.elevationMeters === null ? {} : { elevationMeters: sample.elevationMeters }),
        ...(sample.gradePercent === null ? {} : { gradePercent: sample.gradePercent })
      }
    };
  });
  return next;
}

function nearestProgress<T extends { progress: number }>(samples: T[], progress: number): T {
  return samples.reduce((best, sample) => Math.abs(sample.progress - progress) < Math.abs(best.progress - progress) ? sample : best);
}
