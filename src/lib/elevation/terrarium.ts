import { PNG } from "pngjs";
import type { Coordinate } from "../replay-types";
import { DEM_TILE_SIZE, longitudeLatitudeToWorld, terrariumElevationMeters } from "../visualization/spatial-reference";

export const TERRARIUM_DATASET = "Mapzen Terrarium DEM tiles via AWS Open Data";
export const TERRARIUM_ATTRIBUTION = "Elevation tiles via AWS Open Data; underlying sources include 3DEP, SRTM, and other regional DEMs.";
export const TERRARIUM_URL_TEMPLATE = "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png";

export type TilePixel = { tileX: number; tileY: number; pixelX: number; pixelY: number };

export function coordinateToTilePixel(coordinate: Coordinate, zoom: number, tileSize = DEM_TILE_SIZE): TilePixel {
  const scale = 2 ** zoom;
  const [normalizedX, normalizedY] = longitudeLatitudeToWorld(coordinate);
  const worldX = normalizedX * scale;
  const worldY = normalizedY * scale;
  const tileX = Math.floor(worldX);
  const tileY = Math.floor(worldY);
  return {
    tileX,
    tileY,
    pixelX: (worldX - tileX) * tileSize,
    pixelY: (worldY - tileY) * tileSize
  };
}

export function decodeTerrariumPng(buffer: Buffer): { width: number; height: number; elevations: Float64Array } {
  const png = PNG.sync.read(buffer);
  const elevations = new Float64Array(png.width * png.height);
  for (let index = 0; index < elevations.length; index += 1) {
    const offset = index * 4;
    elevations[index] = decodeTerrarium(png.data[offset], png.data[offset + 1], png.data[offset + 2]);
  }
  return { width: png.width, height: png.height, elevations };
}

export function sampleTerrariumTile(tile: { width: number; height: number; elevations: Float64Array }, pixelX: number, pixelY: number): number {
  const x0 = clamp(Math.floor(pixelX), 0, tile.width - 1);
  const y0 = clamp(Math.floor(pixelY), 0, tile.height - 1);
  const x1 = Math.min(x0 + 1, tile.width - 1);
  const y1 = Math.min(y0 + 1, tile.height - 1);
  const fx = Math.max(0, Math.min(1, pixelX - x0));
  const fy = Math.max(0, Math.min(1, pixelY - y0));
  const at = (x: number, y: number) => tile.elevations[y * tile.width + x];
  return mix(mix(at(x0, y0), at(x1, y0), fx), mix(at(x0, y1), at(x1, y1), fx), fy);
}

export function decodeTerrarium(red: number, green: number, blue: number): number {
  return terrariumElevationMeters(red, green, blue);
}

function mix(a: number, b: number, amount: number): number { return a + (b - a) * amount; }
function clamp(value: number, minimum: number, maximum: number): number { return Math.max(minimum, Math.min(maximum, value)); }
