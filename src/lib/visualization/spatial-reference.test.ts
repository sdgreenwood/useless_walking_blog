import { describe, expect, it } from "vitest";
import multioak from "../../../data/replays/multioak-stairs.json";
import type { ReplayDocument } from "@/lib/replay-types";
import { boundsPolygon, longitudeLatitudeToWorld, longitudeLatitudeToXyzTile, routeBounds, terrariumElevationMeters, tilesCoveringBounds, worldToLongitudeLatitude, xyzTileBounds } from "./spatial-reference";

const route = (multioak as unknown as ReplayDocument).route;

describe("canonical spatial reference", () => {
  it("round-trips five route controls through normalized Web Mercator world coordinates", () => {
    const controls = [0, 0.25, 0.5, 0.75, 1].map((progress) => route.samples[Math.round(progress * (route.samples.length - 1))].coordinates);
    controls.forEach((coordinate) => {
      const roundTrip = worldToLongitudeLatitude(longitudeLatitudeToWorld(coordinate));
      expect(roundTrip[0]).toBeCloseTo(coordinate[0], 10);
      expect(roundTrip[1]).toBeCloseTo(coordinate[1], 10);
    });
  });

  it("maps a known Multioak control point to the exact z14 tile requested alongside the basemap", () => {
    const coordinate = route.samples[Math.floor(route.samples.length / 2)].coordinates;
    expect(coordinate).toEqual([-122.4601008185748, 37.75554572414912]);
    expect(longitudeLatitudeToXyzTile(coordinate, 14)).toEqual({ z: 14, x: 2618, y: 6333 });
  });

  it("uses north-origin XYZ y and returns bounds containing all five controls", () => {
    const controls = [0, 0.25, 0.5, 0.75, 1].map((progress) => route.samples[Math.round(progress * (route.samples.length - 1))].coordinates);
    controls.forEach(([longitude, latitude]) => {
      const tile = longitudeLatitudeToXyzTile([longitude, latitude], 14);
      const [west, south, east, north] = xyzTileBounds(tile);
      expect(longitude).toBeGreaterThanOrEqual(west);
      expect(longitude).toBeLessThan(east);
      expect(latitude).toBeGreaterThanOrEqual(south);
      expect(latitude).toBeLessThan(north);
    });
  });

  it("constructs closed route and DEM bounds without transposing axes", () => {
    const bounds = routeBounds(route.geometry.coordinates);
    const polygon = boundsPolygon(bounds);
    expect(polygon[0]).toEqual([bounds[0], bounds[1]]);
    expect(polygon.at(-1)).toEqual(polygon[0]);
    expect(tilesCoveringBounds(bounds, 14).length).toBeGreaterThan(0);
  });

  it("decodes Terrarium RGB values in meters using the provider formula", () => {
    expect(terrariumElevationMeters(137, 219, 68)).toBeCloseTo(2523.265625, 6);
    expect(terrariumElevationMeters(128, 0, 0)).toBe(0);
  });
});
