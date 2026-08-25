import { describe, expect, it } from "vitest";
import demo from "../../../fixtures/demo-replay.json";
import type { ReplayDocument } from "@/lib/replay-types";
import { buildRouteLayers, completedRoutePath, createVisualizationRoute } from "./route-layers";

const route = (demo as unknown as ReplayDocument).route;

describe("deck.gl route layer composition", () => {
  it("builds stable route, event, endpoint, and position layers", () => {
    const layers = buildRouteLayers({
      route: createVisualizationRoute(route),
      progress: 0.5,
      current: route.samples[Math.floor(route.samples.length / 2)].coordinates,
      activeEventId: route.events[1].id
    });
    expect((layers as Array<{ id: string }>).map((layer) => layer.id)).toEqual([
      "route-base-shadow",
      "route-remaining",
      "route-completed",
      "route-events",
      "route-start-finish",
      "current-position-halo",
      "current-position",
      "active-event-label"
    ]);
  });

  it("advances the completed path without changing the full route", () => {
    const current = route.samples[Math.floor(route.samples.length / 2)].coordinates;
    const completed = completedRoutePath(route.geometry.coordinates, current, 0.5);
    expect(completed[0]).toEqual(route.geometry.coordinates[0]);
    expect(completed.at(-1)).toEqual(current);
    expect(completed.length).toBeLessThan(route.geometry.coordinates.length);
  });

  it("keeps a 10,000-point visualization path at full fidelity", () => {
    const coordinates = Array.from({ length: 10_000 }, (_, index) => [-122 + index / 1_000_000, 37 + index / 1_000_000] as [number, number]);
    const completed = completedRoutePath(coordinates, coordinates[5_000], 0.5);
    expect(coordinates).toHaveLength(10_000);
    expect(completed).toHaveLength(5_001);
    expect(completed.at(-1)).toEqual(coordinates[5_000]);
  });
});
