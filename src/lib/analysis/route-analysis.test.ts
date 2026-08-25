import { describe, expect, it } from "vitest";
import type { NormalizedRoute, NormalizedRouteSample } from "../domain/normalized-route";
import { analyzeRoute } from "./route-analysis";

function route(options: { count?: number; stepLongitude?: number; elevations?: Array<number | null>; seconds?: number | null; jumpAt?: number } = {}): NormalizedRoute {
  const count = options.count ?? options.elevations?.length ?? 21;
  const step = options.stepLongitude ?? 0.0001;
  const samples: NormalizedRouteSample[] = Array.from({ length: count }, (_, index) => ({
    sequence: index,
    elapsedSeconds: options.seconds === null ? null : index * (options.seconds ?? 10),
    coordinates: [index >= (options.jumpAt ?? Infinity) ? -121 + index * step : -122 + index * step, 37],
    elevationMeters: options.elevations ? options.elevations[index] : 10,
    horizontalAccuracyMeters: null,
    verticalAccuracyMeters: null
  }));
  return { schemaVersion: 1, source: { kind: "gpx", schemaVersion: 1.1 }, activityType: null, durationSeconds: options.seconds === null ? null : (count - 1) * (options.seconds ?? 10), segments: [{ index: 0, samples }], issues: [] };
}

describe("analyzeRoute", () => {
  it("measures a flat route within geodesic tolerance and emits stable ordered events", () => {
    const first = analyzeRoute(route());
    const second = analyzeRoute(route());
    expect(first.statistics.distanceMeters).toBeCloseTo(177.6, 0);
    expect(first.statistics.elevationGainMeters).toBe(0);
    expect(first.events.map((event) => event.id)).toEqual(second.events.map((event) => event.id));
    expect(first.events.map((event) => event.routeProgress)).toEqual([...first.events].map((event) => event.routeProgress).sort((a, b) => a - b));
    expect(first.events[0].type).toBe("start");
    expect(first.events.at(-1)?.type).toBe("finish");
  });

  it("finds sustained climbing and descending on rolling terrain", () => {
    const elevations = [0, 2, 5, 9, 14, 20, 27, 27, 24, 20, 15, 10, 10, 13, 17, 22, 28];
    const result = analyzeRoute(route({ elevations, stepLongitude: 0.00025 }));
    expect(result.statistics.elevationGainMeters).toBeGreaterThan(25);
    expect(result.statistics.elevationLossMeters).toBeGreaterThan(10);
    expect(result.statistics.longestClimbMeters).toBeGreaterThan(100);
    expect(result.events.some((event) => event.type === "climb")).toBe(true);
    expect(result.events.some((event) => event.type === "descent")).toBe(true);
  });

  it("smooths isolated elevation noise and flags implausible spikes", () => {
    const result = analyzeRoute(route({ elevations: [10, 10, 10, 100, 10, 10, 10], stepLongitude: 0.00005 }));
    expect(result.statistics.highestElevationMeters).toBe(10);
    expect(result.statistics.elevationGainMeters).toBe(0);
    expect(result.quality).toContainEqual({ code: "elevation_spike", count: 2 });
  });

  it("degrades missing time and elevation without fabricated statistics", () => {
    const result = analyzeRoute(route({ elevations: [null, null, null], seconds: null }));
    expect(result.statistics.durationSeconds).toBeNull();
    expect(result.statistics.averageSpeedMetersPerSecond).toBeNull();
    expect(result.statistics.elevationGainMeters).toBeNull();
    expect(result.quality.map((flag) => flag.code)).toEqual(expect.arrayContaining(["missing_time", "missing_elevation"]));
  });

  it("handles tiny routes, duplicates, sparse samples, and GPS jumps", () => {
    const tiny = analyzeRoute(route({ count: 1 }));
    expect(tiny.quality).toContainEqual({ code: "too_few_samples", count: 1 });
    expect(tiny.events.map((event) => event.type)).toEqual(["start", "finish"]);

    const duplicate = analyzeRoute(route({ count: 3, stepLongitude: 0, seconds: 180 }));
    expect(duplicate.quality.map((flag) => flag.code)).toEqual(expect.arrayContaining(["duplicate_points", "sparse_samples"]));

    const jumped = analyzeRoute(route({ count: 5, jumpAt: 3 }));
    expect(jumped.quality.some((flag) => flag.code === "gps_jump")).toBe(true);
  });

  it("caps unusually long routes at sixty compact events", () => {
    const result = analyzeRoute(route({ count: 1001, stepLongitude: 0.0002 }));
    expect(result.statistics.distanceMeters).toBeGreaterThan(15000);
    expect(result.events.length).toBeLessThanOrEqual(60);
  });

  it("never invents elevation change, grade, or climbs across segment boundaries", () => {
    const input = route({ count: 3, elevations: [10, 10, 10] });
    input.segments.push({
      index: 1,
      samples: [
        { sequence: 0, elapsedSeconds: 30, coordinates: [-121, 38], elevationMeters: 110, horizontalAccuracyMeters: null, verticalAccuracyMeters: null },
        { sequence: 1, elapsedSeconds: 40, coordinates: [-120.9999, 38], elevationMeters: 110, horizontalAccuracyMeters: null, verticalAccuracyMeters: null },
        { sequence: 2, elapsedSeconds: 50, coordinates: [-120.9998, 38], elevationMeters: 110, horizontalAccuracyMeters: null, verticalAccuracyMeters: null }
      ]
    });
    input.durationSeconds = 50;

    const result = analyzeRoute(input);
    expect(result.statistics.elevationGainMeters).toBe(0);
    expect(result.statistics.elevationLossMeters).toBe(0);
    expect(result.statistics.longestClimbMeters).toBe(0);
    expect(result.samples[3].gradePercent).toBeNull();
    expect(result.events.some((event) => event.type === "climb" || event.type === "descent")).toBe(false);
    expect(result.quality.some((flag) => flag.code === "elevation_spike")).toBe(false);
  });
});
