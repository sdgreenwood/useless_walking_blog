export type Coordinate = [longitude: number, latitude: number];

export type RouteSample = {
  progress: number;
  distanceMeters: number;
  elapsedSeconds: number | null;
  coordinates: Coordinate;
  elevationMeters: number | null;
  gradePercent: number | null;
};

export type RouteEvent = {
  id: string;
  type: string;
  routeProgress: number;
  distanceMeters: number;
  elapsedSeconds: number | null;
  coordinates: Coordinate;
  metrics: Record<string, number>;
  importance: number;
};

export type Commentary = {
  eventId: string;
  speaker: "play_by_play" | "color" | "stats_desk" | "field_reporter";
  text: string;
  importance: number;
  source: "fixture" | "openai" | "deterministic";
};

export type ReplayRoute = {
  id: string;
  name: string;
  createdAt: string;
  source: "fixture" | "walkinglab" | "gpx";
  geometry: { type: "LineString"; coordinates: Coordinate[] };
  samples: RouteSample[];
  distanceMeters: number;
  elevationGainMeters: number | null;
  durationSeconds: number | null;
  stats: {
    averagePaceSecondsPerKilometer: number | null;
    highestElevationMeters: number | null;
    lowestElevationMeters: number | null;
    steepestGradePercent: number | null;
    longestClimbMeters: number | null;
    sampleCount: number;
  };
  events: RouteEvent[];
  commentary: Commentary[];
};

export type ReplayDocument = { schemaVersion: number; route: ReplayRoute };
