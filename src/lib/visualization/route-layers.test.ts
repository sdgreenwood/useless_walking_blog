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

  it("adds deterministic territory cells only in Hex Ghost mode", () => {
    const visualizationRoute = createVisualizationRoute(route);
    const layers = buildRouteLayers({
      route: visualizationRoute,
      progress: 0.5,
      current: route.samples[0].coordinates,
      mode: "hex-ghost"
    });
    expect(visualizationRoute.hexCells.length).toBeGreaterThan(100);
    expect((layers as Array<{ id: string }>).map((layer) => layer.id)).toContain("hex-ghost-territory");
  });

  it("preserves sample elevation for Relief Broadcast", () => {
    const visualizationRoute = createVisualizationRoute(route);
    expect(visualizationRoute.elevationPathData[0].path).toHaveLength(route.samples.length);
    expect(visualizationRoute.elevationPathData[0].path.every((coordinate) => coordinate.length === 3)).toBe(true);
    expect(visualizationRoute.endpointData.every((point) => point.elevatedCoordinates.length === 3)).toBe(true);
    expect(visualizationRoute.eventData).toHaveLength(route.events.length);
  });

  it("uses sampled terrain elevation as the Relief display datum", () => {
    const terrain = route.samples.map(() => 125);
    const visualizationRoute = createVisualizationRoute(route, terrain);
    expect(visualizationRoute.elevationPathData[0].path.every((coordinate) => coordinate[2] === 125)).toBe(true);
    expect(visualizationRoute.endpointData.every((point) => point.elevatedCoordinates[2] === 125)).toBe(true);
    expect(visualizationRoute.eventData.every((datum) => datum.elevatedCoordinates[2] === 125)).toBe(true);
  });

  it("adds five control points, route bounds, and DEM XYZ tile bounds in spatial debug mode", () => {
    const layers = buildRouteLayers({
      route: createVisualizationRoute(route),
      progress: 0,
      current: route.samples[0].coordinates,
      spatialDebug: true
    });
    const ids = (layers as Array<{ id: string }>).map((layer) => layer.id);
    expect(ids).toEqual(expect.arrayContaining([
      "spatial-debug-route-bounds",
      "spatial-debug-dem-tiles",
      "spatial-debug-controls",
      "spatial-debug-labels"
    ]));
  });
});
