import type { Coordinate } from "@/lib/replay-types";

export const WEB_MERCATOR_MAX_LATITUDE = 85.0511287798066;
export const DEM_DATA_MAX_ZOOM = 15;
export const DEM_MAX_ZOOM = 14;
export const DEM_TILE_SIZE = 256;

/** Accept a terrain profile only when every point shares the DEM datum. */
export function acceptCompleteTerrainElevations(elevations: Array<number | null>): number[] | null {
  return elevations.every((elevation): elevation is number => elevation !== null && Number.isFinite(elevation))
    ? elevations
    : null;
}

export type XyzTile = { z: number; x: number; y: number };
export type GeographicBounds = [west: number, south: number, east: number, north: number];

/** Canonical geographic input: WGS84 longitude/latitude in degrees. */
export function longitudeLatitudeToWorld([longitude, latitude]: Coordinate): [number, number] {
  const clampedLatitude = Math.max(-WEB_MERCATOR_MAX_LATITUDE, Math.min(WEB_MERCATOR_MAX_LATITUDE, latitude));
  const latitudeRadians = clampedLatitude * Math.PI / 180;
  return [(longitude + 180) / 360, (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2];
}

export function worldToLongitudeLatitude([worldX, worldY]: [number, number]): Coordinate {
  return [worldX * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * worldY))) * 180 / Math.PI];
}

export function longitudeLatitudeToXyzTile(coordinate: Coordinate, zoom: number): XyzTile {
  const [worldX, worldY] = longitudeLatitudeToWorld(coordinate);
  const scale = 2 ** zoom;
  return { z: zoom, x: Math.min(scale - 1, Math.max(0, Math.floor(worldX * scale))), y: Math.min(scale - 1, Math.max(0, Math.floor(worldY * scale))) };
}

export function xyzTileBounds({ z, x, y }: XyzTile): GeographicBounds {
  const scale = 2 ** z;
  const [west, north] = worldToLongitudeLatitude([x / scale, y / scale]);
  const [east, south] = worldToLongitudeLatitude([(x + 1) / scale, (y + 1) / scale]);
  return [west, south, east, north];
}

export function routeBounds(coordinates: Coordinate[]): GeographicBounds {
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)];
}

export function boundsPolygon([west, south, east, north]: GeographicBounds): Coordinate[] {
  return [[west, south], [east, south], [east, north], [west, north], [west, south]];
}

export function tilesCoveringBounds(bounds: GeographicBounds, zoom: number): XyzTile[] {
  const [west, south, east, north] = bounds;
  const northwest = longitudeLatitudeToXyzTile([west, north], zoom);
  const southeast = longitudeLatitudeToXyzTile([east, south], zoom);
  const tiles: XyzTile[] = [];
  for (let y = northwest.y; y <= southeast.y; y += 1) {
    for (let x = northwest.x; x <= southeast.x; x += 1) tiles.push({ z: zoom, x, y });
  }
  return tiles;
}

export function terrariumElevationMeters(red: number, green: number, blue: number): number {
  return red * 256 + green + blue / 256 - 32768;
}
