import { describe, expect, it } from "vitest";
import type { NormalizedRoute } from "../domain/normalized-route";
import { buildReplay } from "./build-replay";

function route(): NormalizedRoute {
  return {
    schemaVersion: 1,
    source: { kind: "walkinglab", schemaVersion: 1 },
    activityType: "walking",
    durationSeconds: 80,
    issues: [],
    segments: [{
      index: 0,
      samples: Array.from({ length: 9 }, (_, index) => ({
        sequence: index,
        elapsedSeconds: index * 10,
        coordinates: [-122 + index * 0.001, 37] as [number, number],
        elevationMeters: 10 + index * 2,
        horizontalAccuracyMeters: 2,
        verticalAccuracyMeters: 2
      }))
    }]
  };
}

describe("buildReplay", () => {
  it("trims private endpoints and emits a self-contained replay", () => {
    const result = buildReplay(route(), { id: "synthetic-route", name: "Synthetic route", trimStartMeters: 100, trimEndMeters: 100 });
    expect(result.privacy.originalSampleCount).toBe(9);
    expect(result.privacy.publishedSampleCount).toBeLessThan(9);
    expect(result.replay.route.geometry.coordinates[0]).not.toEqual(route().segments[0].samples[0].coordinates);
    expect(result.replay.route.commentary.every((line) => line.source === "deterministic")).toBe(true);
    expect(result.replay.route.events[0].type).toBe("route_start");
  });

  it("rejects unsafe identifiers and over-trimming", () => {
    expect(() => buildReplay(route(), { id: "Not Safe", name: "x", trimStartMeters: 0, trimEndMeters: 0 })).toThrow("kebab-case");
    expect(() => buildReplay(route(), { id: "safe", name: "x", trimStartMeters: 5000, trimEndMeters: 5000 })).toThrow("removes the entire");
  });

  it("preserves missing elevation without fabricating zero", () => {
    const missing = route();
    missing.segments[0].samples.forEach((sample) => { sample.elevationMeters = null; });
    const result = buildReplay(missing, { id: "missing-elevation", name: "Missing", trimStartMeters: 0, trimEndMeters: 0 });
    expect(result.replay.route.elevationGainMeters).toBeNull();
    expect(result.replay.route.samples.every((sample) => sample.elevationMeters === null)).toBe(true);
  });

  it("refuses to invent geometry between route fragments", () => {
    const fragmented = route();
    fragmented.segments.push({ index: 1, samples: fragmented.segments[0].samples.map((sample) => ({ ...sample, coordinates: [sample.coordinates[0] + 1, sample.coordinates[1]] })) });
    expect(() => buildReplay(fragmented, { id: "fragments", name: "Fragments", trimStartMeters: 0, trimEndMeters: 0 })).toThrow("one contiguous route segment");
  });
});
