import type { ImportIssue, NormalizedRoute, NormalizedRouteSample } from "../domain/normalized-route";

export class TcxImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TcxImportError";
  }
}

/** Parse TCX track geometry without retaining identifiers, absolute timestamps, or sensor metadata. */
export function importTcxRoute(xml: string): NormalizedRoute {
  if (typeof xml !== "string" || !/<(?:\w+:)?TrainingCenterDatabase\b/i.test(xml)) {
    throw new TcxImportError("Input is not a TCX document.");
  }
  if (!/<\/(?:\w+:)?TrainingCenterDatabase\s*>/i.test(xml)) {
    throw new TcxImportError("TCX document is malformed.");
  }

  const issues: ImportIssue[] = [];
  const trackMatches = [...xml.matchAll(/<(?:\w+:)?Track\b[^>]*>([\s\S]*?)<\/(?:\w+:)?Track\s*>/gi)];
  if (trackMatches.length === 0) throw new TcxImportError("TCX document contains no tracks.");

  let routeStart: number | null = null;
  const segments = trackMatches.map((track, segmentIndex) => {
    const samples: NormalizedRouteSample[] = [];
    const pointMatches = [...track[1].matchAll(/<(?:\w+:)?Trackpoint\b[^>]*>([\s\S]*?)<\/(?:\w+:)?Trackpoint\s*>/gi)];
    pointMatches.forEach((point) => {
      const position = elementBody(point[1], "Position");
      if (position === null) return;
      const latitude = elementNumber(position, "LatitudeDegrees");
      const longitude = elementNumber(position, "LongitudeDegrees");
      const sourceIndex = samples.length;
      if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        issues.push({ code: "invalid_sample", segmentIndex, sampleIndex: sourceIndex });
        return;
      }
      const timeText = elementText(point[1], "Time");
      const timestamp = timeText === null ? null : Date.parse(timeText) / 1000;
      const validTimestamp = timestamp !== null && Number.isFinite(timestamp) ? timestamp : null;
      routeStart ??= validTimestamp;
      const elapsedSeconds = validTimestamp !== null && routeStart !== null ? validTimestamp - routeStart : null;
      const previous = samples.at(-1);
      if (previous?.elapsedSeconds !== null && previous?.elapsedSeconds !== undefined && elapsedSeconds !== null && elapsedSeconds < previous.elapsedSeconds) {
        issues.push({ code: "non_monotonic_time", segmentIndex, sampleIndex: sourceIndex });
      }
      samples.push({
        sequence: sourceIndex,
        elapsedSeconds,
        coordinates: [longitude, latitude],
        elevationMeters: elementNumber(point[1], "AltitudeMeters"),
        horizontalAccuracyMeters: null,
        verticalAccuracyMeters: null
      });
    });
    if (samples.length === 0) issues.push({ code: "empty_segment", segmentIndex });
    return { index: segmentIndex, samples };
  }).filter((segment) => segment.samples.length > 0);

  if (segments.length === 0) throw new TcxImportError("TCX document contains no valid positioned track points.");
  const elapsed = segments.flatMap((segment) => segment.samples.map((sample) => sample.elapsedSeconds)).filter((value): value is number => value !== null);
  return {
    schemaVersion: 1,
    source: { kind: "tcx", schemaVersion: tcxVersion(xml) },
    activityType: activityType(xml),
    durationSeconds: elapsed.length > 1 ? Math.max(...elapsed) - Math.min(...elapsed) : null,
    segments,
    issues
  };
}

function elementBody(body: string, name: string): string | null {
  return body.match(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${name}\\s*>`, "i"))?.[1] ?? null;
}

function elementText(body: string, name: string): string | null {
  return body.match(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>([^<]*)<\\/(?:\\w+:)?${name}\\s*>`, "i"))?.[1].trim() || null;
}

function elementNumber(body: string, name: string): number | null {
  const text = elementText(body, name);
  if (text === null) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function activityType(xml: string): string | null {
  const activity = xml.match(/<(?:\w+:)?Activity\b([^>]*)>/i);
  return activity?.[1].match(/\bSport\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;
}

function tcxVersion(xml: string): number | null {
  const namespace = xml.match(/xmlns\s*=\s*["'][^"']*\/v(\d+)["']/i);
  return namespace ? Number(namespace[1]) : null;
}
