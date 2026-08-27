import { describe, expect, it } from "vitest";
import { coordinateToTilePixel, decodeTerrarium, sampleTerrariumTile } from "./terrarium";

describe("Terrarium elevation", () => {
  it("decodes the provider's RGB meter contract", () => {
    expect(decodeTerrarium(128, 0, 0)).toBe(0);
    expect(decodeTerrarium(128, 10, 128)).toBe(10.5);
  });

  it("uses XYZ Web Mercator coordinates in longitude/latitude order", () => {
    const point = coordinateToTilePixel([-122.4473064, 37.7721574], 14);
    expect(point.tileX).toBe(2619);
    expect(point.tileY).toBe(6332);
    expect(point.pixelX).toBeGreaterThanOrEqual(0);
    expect(point.pixelX).toBeLessThan(256);
    expect(point.pixelY).toBeGreaterThanOrEqual(0);
    expect(point.pixelY).toBeLessThan(256);
  });

  it("bilinearly samples a decoded tile", () => {
    const elevations = new Float64Array([0, 10, 20, 30]);
    expect(sampleTerrariumTile({ width: 2, height: 2, elevations }, 0.5, 0.5)).toBe(15);
  });
});
