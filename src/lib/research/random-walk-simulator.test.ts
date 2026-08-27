import { describe, expect, it } from "vitest";
import { buildRandomWalkGraph, isWalkableWay, simulateRandomWalk, summarizeRandomWalks, type OsmDocument } from "./random-walk-simulator";

const fixture: OsmDocument = {
  osm3s: { timestamp_osm_base: "2026-08-27T00:00:00Z" },
  elements: [
    { type: "node", id: 1, lat: 0, lon: 0 },
    { type: "node", id: 2, lat: 0, lon: 0.001 },
    { type: "node", id: 3, lat: 0, lon: 0.002 },
    { type: "node", id: 4, lat: 0.001, lon: 0.001 },
    { type: "way", id: 10, nodes: [1, 2, 3], tags: { highway: "residential" } },
    { type: "way", id: 11, nodes: [2, 4], tags: { highway: "footway" } }
  ]
};

describe("pure random city simulator", () => {
  it("builds the decision graph and reproduces a seeded complete walk", () => {
    const graph = buildRandomWalkGraph(fixture);
    const first = simulateRandomWalk(graph, 42);
    expect(graph.statistics.reachableSegments).toBe(3);
    expect(first).toEqual(simulateRandomWalk(graph, 42));
    expect(first.revisitTraversals).toBe(first.traversals - 3);
    expect(first.coverageMultiple).toBeGreaterThanOrEqual(1);
  });

  it("summarizes measured runs without inventing missing percentiles", () => {
    const graph = buildRandomWalkGraph(fixture);
    const summary = summarizeRandomWalks(Array.from({ length: 10 }, (_, index) => simulateRandomWalk(graph, 100 + index)));
    expect(summary.runs).toBe(10);
    expect(summary.fast.distanceKilometers).toBeLessThanOrEqual(summary.typical.distanceKilometers);
    expect(summary.typical.distanceKilometers).toBeLessThanOrEqual(summary.slow.distanceKilometers);
  });

  it("reports a censored run instead of pretending it completed", () => {
    const graph = buildRandomWalkGraph(fixture);
    const result = simulateRandomWalk(graph, 42, 1);
    expect(result.completed).toBe(false);
    expect(result.coverageShare).toBeLessThan(1);
  });

  it("retains the published bridge-free and access rules", () => {
    expect(isWalkableWay({ type: "way", id: 1, nodes: [], tags: { highway: "residential" } })).toBe(true);
    expect(isWalkableWay({ type: "way", id: 2, nodes: [], tags: { highway: "footway", bridge: "yes" } })).toBe(false);
    expect(isWalkableWay({ type: "way", id: 3, nodes: [], tags: { highway: "service", access: "private" } })).toBe(false);
  });
});
