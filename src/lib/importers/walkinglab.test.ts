import { describe, expect, it } from "vitest";
import { importWalkingLabRoute, WalkingLabImportError } from "./walkinglab";

function exportFixture() {
  return {
    schemaVersion: 1,
    generatedAt: { unixSeconds: 9999 },
    privacy: "PRIVATE",
    workout: {
      activityType: "walking",
      start: { unixSeconds: 1000 },
      end: { unixSeconds: 1060 },
      healthKitWorkoutUUID: "must-not-cross-boundary",
      source: { productType: "must-not-cross-boundary" }
    },
    routes: [{
      healthKitRouteUUID: "must-not-cross-boundary",
      source: { bundleIdentifier: "must-not-cross-boundary" },
      samples: [
        { sequence: 0, timestamp: { unixSeconds: 1000 }, latitudeDegrees: 37.1, longitudeDegrees: -122.1, altitudeMeters: 10, horizontalAccuracyMeters: 2, verticalAccuracyMeters: 3 },
        { sequence: 1, timestamp: { unixSeconds: 1015 }, latitudeDegrees: 37.2, longitudeDegrees: -122.2, altitudeMeters: 12, horizontalAccuracyMeters: 2, verticalAccuracyMeters: 3 }
      ]
    }]
  };
}

describe("WalkingLab importer", () => {
  it("projects analysis evidence and removes private identifiers", () => {
    const result = importWalkingLabRoute(exportFixture());
    expect(result.source).toEqual({ kind: "walkinglab", schemaVersion: 1 });
    expect(result.activityType).toBe("walking");
    expect(result.durationSeconds).toBe(60);
    expect(result.segments[0].samples[1]).toMatchObject({
      sequence: 1,
      elapsedSeconds: 15,
      coordinates: [-122.2, 37.2],
      elevationMeters: 12
    });
    expect(JSON.stringify(result)).not.toContain("must-not-cross-boundary");
    expect(JSON.stringify(result)).not.toContain("healthKit");
  });

  it("drops invalid samples and reports quality issues", () => {
    const fixture = exportFixture();
    fixture.routes[0].samples.push({
      sequence: 2,
      timestamp: { unixSeconds: 1030 },
      latitudeDegrees: 120,
      longitudeDegrees: -122,
      altitudeMeters: 0,
      horizontalAccuracyMeters: 0,
      verticalAccuracyMeters: 0
    });
    const result = importWalkingLabRoute(fixture);
    expect(result.segments[0].samples).toHaveLength(2);
    expect(result.issues).toEqual([{ code: "invalid_sample", segmentIndex: 0, sampleIndex: 2 }]);
  });

  it("preserves absence instead of fabricating zero", () => {
    const fixture = exportFixture();
    delete (fixture.routes[0].samples[0] as Partial<typeof fixture.routes[0]["samples"][number]>).altitudeMeters;
    const result = importWalkingLabRoute(fixture);
    expect(result.segments[0].samples[0].elevationMeters).toBeNull();
  });

  it("rejects unsupported schemas and missing routes", () => {
    expect(() => importWalkingLabRoute({ schemaVersion: 2, routes: [] })).toThrow(WalkingLabImportError);
    expect(() => importWalkingLabRoute({ schemaVersion: 1, routes: [] })).toThrow("contains no routes");
  });
});
