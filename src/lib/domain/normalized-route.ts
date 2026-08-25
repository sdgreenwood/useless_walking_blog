import type { Coordinate } from "../replay-types";

export type NormalizedRouteSample = {
  sequence: number;
  elapsedSeconds: number | null;
  coordinates: Coordinate;
  elevationMeters: number | null;
  horizontalAccuracyMeters: number | null;
  verticalAccuracyMeters: number | null;
};

export type NormalizedRouteSegment = {
  index: number;
  samples: NormalizedRouteSample[];
};

export type ImportIssue = {
  code: "invalid_sample" | "empty_segment" | "non_monotonic_sequence" | "non_monotonic_time";
  segmentIndex: number;
  sampleIndex?: number;
};

export type NormalizedRoute = {
  schemaVersion: 1;
  source: {
    kind: "walkinglab" | "gpx";
    schemaVersion: number | null;
  };
  activityType: string | null;
  durationSeconds: number | null;
  segments: NormalizedRouteSegment[];
  issues: ImportIssue[];
};
