import { describe, expect, it } from "vitest";
import demo from "../../../fixtures/demo-replay.json";
import type { ReplayDocument } from "../replay-types";
import { applyDemElevation } from "./replay-elevation";

describe("DEM replay enrichment", () => {
  it("derives route statistics while preserving geometry and commentary", () => {
    const replay = structuredClone(demo) as unknown as ReplayDocument;
    replay.route.samples.forEach((sample) => { sample.elevationMeters = null; sample.gradePercent = null; });
    replay.route.elevationGainMeters = null;
    const elevations = replay.route.samples.map((_, index) => index < replay.route.samples.length / 2 ? index * 2 : (replay.route.samples.length - index) * 2);
    const enriched = applyDemElevation(replay, elevations, {
      dataset: "test DEM",
      attribution: "test attribution",
      sampledAt: "2026-08-27T00:00:00Z",
      zoom: 14
    });
    expect(enriched.route.geometry).toEqual(replay.route.geometry);
    expect(enriched.route.commentary).toEqual(replay.route.commentary);
    expect(enriched.route.elevationGainMeters).toBeGreaterThan(0);
    expect(enriched.route.elevationSource?.kind).toBe("terrarium-dem");
  });

  it("rejects incomplete elevation profiles", () => {
    expect(() => applyDemElevation(demo as unknown as ReplayDocument, [1], {
      dataset: "test", attribution: "test", sampledAt: "2026-08-27T00:00:00Z", zoom: 14
    })).toThrow("one finite value");
  });
});
