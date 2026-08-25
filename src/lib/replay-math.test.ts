import { describe, expect, it } from "vitest";
import demoReplay from "../../fixtures/demo-replay.json";
import { clampProgress, formatClock, sampleAtProgress, visibleCommentary } from "./replay-math";
import type { ReplayDocument } from "./replay-types";

const route = (demoReplay as unknown as ReplayDocument).route;

describe("replay math", () => {
  it("clamps replay progress", () => {
    expect(clampProgress(-1)).toBe(0);
    expect(clampProgress(2)).toBe(1);
  });

  it("interpolates route samples", () => {
    const sample = sampleAtProgress(route.samples, 0.5);
    expect(sample.progress).toBe(0.5);
    expect(sample.distanceMeters).toBeGreaterThan(1500);
    expect(sample.distanceMeters).toBeLessThan(1550);
  });

  it("reveals commentary deterministically", () => {
    expect(visibleCommentary(route, 0)).toHaveLength(1);
    expect(visibleCommentary(route, 1)).toHaveLength(route.commentary.length);
  });

  it("uses an editorial display beat without changing its event anchor", () => {
    const scheduledRoute = structuredClone(route);
    scheduledRoute.commentary.push({
      eventId: scheduledRoute.events[0].id,
      displayProgress: 0.5,
      speaker: "color",
      text: "A scheduled editorial beat.",
      importance: 1,
      source: "deterministic"
    });
    expect(visibleCommentary(scheduledRoute, 0.49)).toHaveLength(visibleCommentary(route, 0.49).length);
    expect(visibleCommentary(scheduledRoute, 0.5)).toHaveLength(visibleCommentary(route, 0.5).length + 1);
  });

  it("formats elapsed time", () => expect(formatClock(2630)).toBe("43:50"));
});
