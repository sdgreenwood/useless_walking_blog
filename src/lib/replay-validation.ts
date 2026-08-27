import type { Coordinate, ReplayDocument } from "./replay-types";

export class ReplayValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplayValidationError";
  }
}

export function parseReplayDocument(value: unknown, expectedId?: string): ReplayDocument {
  const root = object(value, "replay");
  if (root.schemaVersion !== 1) fail("replay.schemaVersion must be 1");
  const route = object(root.route, "replay.route");
  const id = text(route.id, "route.id");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail("route.id must be lowercase kebab-case");
  if (expectedId && id !== expectedId) fail("route.id must match its replay filename");
  text(route.name, "route.name");
  if (typeof route.createdAt !== "string" || !Number.isFinite(Date.parse(route.createdAt))) fail("route.createdAt must be ISO-8601");
  if (!new Set(["fixture", "walkinglab", "gpx", "tcx", "simulation"]).has(String(route.source))) fail("route.source is invalid");

  const geometry = object(route.geometry, "route.geometry");
  if (geometry.type !== "LineString") fail("route.geometry must be a LineString");
  const coordinates = coordinateArray(geometry.coordinates, "route.geometry.coordinates", 2);
  const samples = array(route.samples, "route.samples");
  if (samples.length < 2) fail("route.samples must contain at least two samples");
  if (coordinates.length !== samples.length) fail("route geometry and sample counts must match");
  let previousProgress = -1;
  let previousDistance = -1;
  samples.forEach((raw, index) => {
    const sample = object(raw, `samples[${index}]`);
    const progress = bounded(sample.progress, `samples[${index}].progress`, 0, 1);
    const distance = bounded(sample.distanceMeters, `samples[${index}].distanceMeters`, 0);
    optionalFinite(sample.elapsedSeconds, `samples[${index}].elapsedSeconds`, 0);
    optionalFinite(sample.elevationMeters, `samples[${index}].elevationMeters`);
    optionalFinite(sample.gradePercent, `samples[${index}].gradePercent`);
    const coordinate = parseCoordinate(sample.coordinates, `samples[${index}].coordinates`);
    if (coordinate[0] !== coordinates[index][0] || coordinate[1] !== coordinates[index][1]) fail(`samples[${index}] coordinate must match geometry`);
    if (progress < previousProgress || distance < previousDistance) fail("sample progress and distance must be ordered");
    previousProgress = progress;
    previousDistance = distance;
  });
  if (Math.abs(number(object(samples[0], "first sample").progress, "first progress")) > 0.001) fail("first sample progress must be zero");
  if (Math.abs(number(object(samples.at(-1), "last sample").progress, "last progress") - 1) > 0.001) fail("last sample progress must be one");

  const distanceMeters = bounded(route.distanceMeters, "route.distanceMeters", 0.01);
  if (Math.abs(previousDistance - distanceMeters) > Math.max(1, distanceMeters * 0.001)) fail("route distance must match final sample");
  optionalFinite(route.elevationGainMeters, "route.elevationGainMeters", 0);
  optionalFinite(route.durationSeconds, "route.durationSeconds", 0);
  const stats = object(route.stats, "route.stats");
  optionalFinite(stats.averagePaceSecondsPerKilometer, "stats.averagePaceSecondsPerKilometer", 0);
  optionalFinite(stats.highestElevationMeters, "stats.highestElevationMeters");
  optionalFinite(stats.lowestElevationMeters, "stats.lowestElevationMeters");
  optionalFinite(stats.steepestGradePercent, "stats.steepestGradePercent");
  optionalFinite(stats.longestClimbMeters, "stats.longestClimbMeters", 0);
  if (!Number.isInteger(stats.sampleCount) || stats.sampleCount !== samples.length) fail("stats.sampleCount must match samples");

  const events = array(route.events, "route.events");
  if (events.length < 2) fail("route.events must include start and finish");
  const eventIds = new Set<string>();
  let previousEventProgress = -1;
  events.forEach((raw, index) => {
    const event = object(raw, `events[${index}]`);
    const eventId = text(event.id, `events[${index}].id`);
    if (eventIds.has(eventId)) fail(`duplicate event id: ${eventId}`);
    eventIds.add(eventId);
    text(event.type, `events[${index}].type`);
    const progress = bounded(event.routeProgress, `events[${index}].routeProgress`, 0, 1);
    if (progress < previousEventProgress) fail("events must be ordered by progress");
    previousEventProgress = progress;
    bounded(event.distanceMeters, `events[${index}].distanceMeters`, 0);
    optionalFinite(event.elapsedSeconds, `events[${index}].elapsedSeconds`, 0);
    parseCoordinate(event.coordinates, `events[${index}].coordinates`);
    const metrics = object(event.metrics, `events[${index}].metrics`);
    Object.entries(metrics).forEach(([key, metric]) => number(metric, `events[${index}].metrics.${key}`));
    bounded(event.importance, `events[${index}].importance`, 1, 3);
  });
  if (!events.some((raw) => object(raw, "event").type === "route_start" && number(object(raw, "event").routeProgress, "event progress") <= 0.001)) fail("events must include route_start at zero progress");
  if (!events.some((raw) => object(raw, "event").type === "finish" && number(object(raw, "event").routeProgress, "event progress") >= 0.999)) fail("events must include finish at full progress");

  const commentary = array(route.commentary, "route.commentary");
  if (!commentary.length) fail("route.commentary must not be empty");
  commentary.forEach((raw, index) => {
    const line = object(raw, `commentary[${index}]`);
    if (!eventIds.has(text(line.eventId, `commentary[${index}].eventId`))) fail(`commentary[${index}] references an unknown event`);
    if (line.displayProgress !== undefined) bounded(line.displayProgress, `commentary[${index}].displayProgress`, 0, 1);
    if (!new Set(["play_by_play", "color", "stats_desk", "field_reporter"]).has(String(line.speaker))) fail(`commentary[${index}].speaker is invalid`);
    text(line.text, `commentary[${index}].text`);
    bounded(line.importance, `commentary[${index}].importance`, 1, 3);
    if (!new Set(["fixture", "openai", "deterministic"]).has(String(line.source))) fail(`commentary[${index}].source is invalid`);
  });
  return value as ReplayDocument;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}
function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 500) fail(`${label} must be non-empty text`);
  return value;
}
function number(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${label} must be finite`);
  return value;
}
function bounded(value: unknown, label: string, min: number, max = Number.POSITIVE_INFINITY): number {
  const parsed = number(value, label);
  if (parsed < min || parsed > max) fail(`${label} must be between ${min} and ${max}`);
  return parsed;
}
function optionalFinite(value: unknown, label: string, min = Number.NEGATIVE_INFINITY): number | null {
  if (value === null) return null;
  return bounded(value, label, min);
}
function coordinateArray(value: unknown, label: string, minimum: number): Coordinate[] {
  const values = array(value, label);
  if (values.length < minimum) fail(`${label} must contain at least ${minimum} coordinates`);
  return values.map((coordinate, index) => parseCoordinate(coordinate, `${label}[${index}]`));
}
function parseCoordinate(value: unknown, label: string): Coordinate {
  const values = array(value, label);
  if (values.length !== 2) fail(`${label} must contain longitude and latitude`);
  const longitude = bounded(values[0], `${label}[0]`, -180, 180);
  const latitude = bounded(values[1], `${label}[1]`, -90, 90);
  return [longitude, latitude];
}
function fail(message: string): never { throw new ReplayValidationError(message); }
