import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GpxImportError, importGpxRoute } from "./gpx";

describe("importGpxRoute", () => {
  it("imports the public demo into the normalized contract", () => {
    const route = importGpxRoute(readFileSync("fixtures/demo-walk.gpx", "utf8"));
    expect(route.source).toEqual({ kind: "gpx", schemaVersion: 1.1 });
    expect(route.segments).toHaveLength(1);
    expect(route.segments[0].samples).toHaveLength(14);
    expect(route.segments[0].samples[0]).toMatchObject({ coordinates: [-122.4862, 37.76942], elapsedSeconds: 0, elevationMeters: 42 });
    expect(route.durationSeconds).toBe(2630);
    expect(route.issues).toEqual([]);
  });

  it("preserves segments and degrades missing optional values to null", () => {
    const route = importGpxRoute(`<gpx version="1.1"><trk><trkseg><trkpt lat="1" lon="2"></trkpt></trkseg><trkseg><trkpt lat="3" lon="4"><ele>bad</ele></trkpt></trkseg></trk></gpx>`);
    expect(route.segments).toHaveLength(2);
    expect(route.segments[0].samples[0]).toMatchObject({ elapsedSeconds: null, elevationMeters: null });
    expect(route.durationSeconds).toBeNull();
  });

  it("reports bad points and rejects unusable documents", () => {
    const route = importGpxRoute(`<gpx><trk><trkseg><trkpt lat="91" lon="0"></trkpt><trkpt lat="1" lon="2"></trkpt></trkseg></trk></gpx>`);
    expect(route.issues).toContainEqual({ code: "invalid_sample", segmentIndex: 0, sampleIndex: 0 });
    expect(() => importGpxRoute("not xml")).toThrow(GpxImportError);
    expect(() => importGpxRoute("<gpx></gpx>")).toThrow("no track segments");
  });
});
