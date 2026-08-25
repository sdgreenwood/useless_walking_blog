import type {
  ImportIssue,
  NormalizedRoute,
  NormalizedRouteSample,
  NormalizedRouteSegment
} from "../domain/normalized-route";

type UnknownRecord = Record<string, unknown>;

export class WalkingLabImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalkingLabImportError";
  }
}

/**
 * Projects a private WalkingLab route export into the minimum route evidence
 * needed by deterministic analysis. UUIDs, device metadata, source bundle
 * identifiers, generation time, and absolute workout time do not cross this boundary.
 */
export function importWalkingLabRoute(input: unknown): NormalizedRoute {
  const root = record(input, "WalkingLab export must be a JSON object.");
  const schemaVersion = integer(root.schemaVersion);
  if (schemaVersion !== 1) {
    throw new WalkingLabImportError(`Unsupported WalkingLab schema version: ${String(root.schemaVersion)}`);
  }

  if (!Array.isArray(root.routes) || root.routes.length === 0) {
    throw new WalkingLabImportError("WalkingLab export contains no routes.");
  }

  const issues: ImportIssue[] = [];
  let routeStart: number | null = null;
  const segments = root.routes.map((value, segmentIndex) => {
    const imported = importSegment(value, segmentIndex, issues, routeStart);
    routeStart ??= imported.firstTimestamp;
    if (routeStart !== null && imported.firstTimestamp !== null && imported.firstTimestamp !== routeStart) {
      imported.segment.samples = rebaseSegment(imported.absoluteTimestamps, imported.segment, routeStart);
    }
    return imported.segment;
  });

  const workout = isRecord(root.workout) ? root.workout : null;
  const start = workout && timestampSeconds(workout.start);
  const end = workout && timestampSeconds(workout.end);
  const durationSeconds = start !== null && end !== null && end >= start ? end - start : inferDuration(segments);

  return {
    schemaVersion: 1,
    source: { kind: "walkinglab", schemaVersion },
    activityType: workout && typeof workout.activityType === "string" ? workout.activityType : null,
    durationSeconds,
    segments,
    issues
  };
}

function importSegment(
  value: unknown,
  segmentIndex: number,
  issues: ImportIssue[],
  existingRouteStart: number | null
): { segment: NormalizedRouteSegment; firstTimestamp: number | null; absoluteTimestamps: Array<number | null> } {
  const route = record(value, `WalkingLab route ${segmentIndex} must be an object.`);
  if (!Array.isArray(route.samples) || route.samples.length === 0) {
    issues.push({ code: "empty_segment", segmentIndex });
    return { segment: { index: segmentIndex, samples: [] }, firstTimestamp: null, absoluteTimestamps: [] };
  }

  const valid: Array<{ sample: NormalizedRouteSample; timestamp: number | null }> = [];
  let previousSequence: number | null = null;
  let previousTimestamp: number | null = null;

  route.samples.forEach((candidate, sampleIndex) => {
    const sample = isRecord(candidate) ? candidate : null;
    if (!sample) {
      issues.push({ code: "invalid_sample", segmentIndex, sampleIndex });
      return;
    }
    const sequence = integer(sample.sequence);
    const latitude = finite(sample.latitudeDegrees);
    const longitude = finite(sample.longitudeDegrees);
    const timestamp = timestampSeconds(sample.timestamp);

    if (sequence === null || latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      issues.push({ code: "invalid_sample", segmentIndex, sampleIndex });
      return;
    }
    if (previousSequence !== null && sequence <= previousSequence) {
      issues.push({ code: "non_monotonic_sequence", segmentIndex, sampleIndex });
    }
    if (timestamp !== null && previousTimestamp !== null && timestamp < previousTimestamp) {
      issues.push({ code: "non_monotonic_time", segmentIndex, sampleIndex });
    }

    const firstTimestamp = existingRouteStart ?? valid.find((item) => item.timestamp !== null)?.timestamp ?? timestamp;
    valid.push({
      timestamp,
      sample: {
        sequence,
        elapsedSeconds: timestamp !== null && firstTimestamp !== null ? timestamp - firstTimestamp : null,
        coordinates: [longitude, latitude],
        elevationMeters: optionalFinite(sample.altitudeMeters),
        horizontalAccuracyMeters: optionalNonNegative(sample.horizontalAccuracyMeters),
        verticalAccuracyMeters: optionalNonNegative(sample.verticalAccuracyMeters)
      }
    });
    previousSequence = sequence;
    if (timestamp !== null) previousTimestamp = timestamp;
  });

  const firstTimestamp = valid.find((item) => item.timestamp !== null)?.timestamp ?? null;
  return {
    segment: { index: segmentIndex, samples: valid.map((item) => item.sample) },
    firstTimestamp,
    absoluteTimestamps: valid.map((item) => item.timestamp)
  };
}

function rebaseSegment(timestamps: Array<number | null>, segment: NormalizedRouteSegment, routeStart: number): NormalizedRouteSample[] {
  return segment.samples.map((sample, index) => ({
    ...sample,
    elapsedSeconds: timestamps[index] === null ? null : timestamps[index]! - routeStart
  }));
}

function inferDuration(segments: NormalizedRouteSegment[]): number | null {
  const values = segments.flatMap((segment) => segment.samples.map((sample) => sample.elapsedSeconds)).filter((value): value is number => value !== null);
  return values.length ? Math.max(...values) : null;
}

function timestampSeconds(value: unknown): number | null {
  return isRecord(value) ? finite(value.unixSeconds) : null;
}

function record(value: unknown, message: string): UnknownRecord {
  if (!isRecord(value)) throw new WalkingLabImportError(message);
  return value;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function optionalFinite(value: unknown): number | null {
  return value === undefined || value === null ? null : finite(value);
}

function optionalNonNegative(value: unknown): number | null {
  const result = optionalFinite(value);
  return result !== null && result >= 0 ? result : null;
}
