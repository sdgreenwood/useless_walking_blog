import { describe, expect, it } from "vitest";
import demo from "../../fixtures/demo-replay.json";
import { parseReplayDocument } from "./replay-validation";
import type { ReplayDocument } from "./replay-types";

describe("parseReplayDocument", () => {
  it("accepts the canonical fixture", () => {
    expect(parseReplayDocument(demo, "demo-championship-loop").route.id).toBe("demo-championship-loop");
  });

  it("rejects empty samples, non-finite metrics, and broken commentary links", () => {
    const empty = structuredClone(demo) as unknown as { route: { samples: unknown[] } };
    empty.route.samples = [];
    expect(() => parseReplayDocument(empty)).toThrow("at least two samples");

    const nonFinite = structuredClone(demo);
    nonFinite.route.events[0].metrics.elevationMeters = Number.NaN;
    expect(() => parseReplayDocument(nonFinite)).toThrow("must be finite");

    const broken = structuredClone(demo);
    broken.route.commentary[0].eventId = "unknown-event";
    expect(() => parseReplayDocument(broken)).toThrow("unknown event");
  });

  it("rejects filename/id mismatch and invalid coordinates", () => {
    expect(() => parseReplayDocument(demo, "wrong-id")).toThrow("filename");
    const invalid = structuredClone(demo);
    invalid.route.geometry.coordinates[0][0] = 500;
    expect(() => parseReplayDocument(invalid)).toThrow("between -180 and 180");
  });

  it("accepts bounded commentary display beats and rejects invalid ones", () => {
    const scheduled = structuredClone(demo) as unknown as ReplayDocument;
    scheduled.route.commentary[0] = { ...scheduled.route.commentary[0], displayProgress: 0.25 };
    expect(parseReplayDocument(scheduled).route.commentary[0].displayProgress).toBe(0.25);

    scheduled.route.commentary[0].displayProgress = 1.1;
    expect(() => parseReplayDocument(scheduled)).toThrow("displayProgress");
  });

  it("accepts TCX as a normalized replay source", () => {
    const tcx = structuredClone(demo) as unknown as ReplayDocument;
    tcx.route.source = "tcx";
    expect(parseReplayDocument(tcx).route.source).toBe("tcx");
  });
});
