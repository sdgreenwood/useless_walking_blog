import type { ImportIssue, NormalizedRoute, NormalizedRouteSample } from "../domain/normalized-route";

export class GpxImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GpxImportError";
  }
}

/** Parse the small, portable GPX surface Walking Ocho needs without retaining metadata. */
export function importGpxRoute(xml: string): NormalizedRoute {
  if (typeof xml !== "string" || !/<(?:\w+:)?gpx\b/i.test(xml)) {
    throw new GpxImportError("Input is not a GPX document.");
  }
  if (/<(?:\w+:)?parsererror\b/i.test(xml) || !/<\/(?:\w+:)?gpx\s*>/i.test(xml)) {
    throw new GpxImportError("GPX document is malformed.");
  }

  const issues: ImportIssue[] = [];
  const segmentMatches = [...xml.matchAll(/<(?:\w+:)?trkseg\b[^>]*>([\s\S]*?)<\/(?:\w+:)?trkseg\s*>/gi)];
  if (segmentMatches.length === 0) throw new GpxImportError("GPX document contains no track segments.");

  let routeStart: number | null = null;
  const segments = segmentMatches.map((match, segmentIndex) => {
    const samples: NormalizedRouteSample[] = [];
    const pointMatches = [...match[1].matchAll(/<(?:\w+:)?trkpt\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?trkpt\s*>/gi)];
    if (pointMatches.length === 0) issues.push({ code: "empty_segment", segmentIndex });

    pointMatches.forEach((point, sampleIndex) => {
      const latitude = attributeNumber(point[1], "lat");
      const longitude = attributeNumber(point[1], "lon");
      if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        issues.push({ code: "invalid_sample", segmentIndex, sampleIndex });
        return;
      }
      const timeText = elementText(point[2], "time");
      const timestamp = timeText === null ? null : Date.parse(timeText) / 1000;
      const validTimestamp = timestamp !== null && Number.isFinite(timestamp) ? timestamp : null;
      routeStart ??= validTimestamp;
      const elevationText = elementText(point[2], "ele");
      const elevation = elevationText === null ? null : Number(elevationText);
      const previous = samples.at(-1);
      const elapsedSeconds = validTimestamp !== null && routeStart !== null ? validTimestamp - routeStart : null;
      if (previous && previous.elapsedSeconds !== null && elapsedSeconds !== null && elapsedSeconds < previous.elapsedSeconds) {
        issues.push({ code: "non_monotonic_time", segmentIndex, sampleIndex });
      }
      samples.push({
        sequence: sampleIndex,
        elapsedSeconds,
        coordinates: [longitude, latitude],
        elevationMeters: elevation !== null && Number.isFinite(elevation) ? elevation : null,
        horizontalAccuracyMeters: null,
        verticalAccuracyMeters: null
      });
    });
    return { index: segmentIndex, samples };
  });

  if (!segments.some((segment) => segment.samples.length > 0)) throw new GpxImportError("GPX document contains no valid track points.");
  const elapsed = segments.flatMap((segment) => segment.samples.map((sample) => sample.elapsedSeconds)).filter((value): value is number => value !== null);
  return {
    schemaVersion: 1,
    source: { kind: "gpx", schemaVersion: gpxVersion(xml) },
    activityType: null,
    durationSeconds: elapsed.length > 1 ? Math.max(...elapsed) - Math.min(...elapsed) : null,
    segments,
    issues
  };
}

function attributeNumber(attributes: string, name: string): number | null {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function elementText(body: string, name: string): string | null {
  const match = body.match(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>([^<]*)<\\/(?:\\w+:)?${name}\\s*>`, "i"));
  return match?.[1].trim() || null;
}

function gpxVersion(xml: string): number | null {
  const root = xml.match(/<(?:\w+:)?gpx\b([^>]*)>/i);
  return root ? attributeNumber(root[1], "version") : null;
}
