"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { WebMercatorViewport } from "@deck.gl/core";
import type { MapViewState } from "@deck.gl/core";
import { Map } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { buildRouteLayers, createVisualizationRoute } from "@/lib/visualization/route-layers";
import type { VisualizationMode } from "@/lib/visualization/route-layers";
import type { Coordinate, ReplayRoute } from "@/lib/replay-types";
import { acceptCompleteTerrainElevations, DEM_DATA_MAX_ZOOM, DEM_MAX_ZOOM, DEM_TILE_SIZE, longitudeLatitudeToXyzTile } from "@/lib/visualization/spatial-reference";

type Props = {
  route: ReplayRoute;
  current: Coordinate;
  currentElevationMeters: number | null;
  progress: number;
  activeEventId?: string;
  mode: VisualizationMode;
  spatialDebug?: boolean;
};

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/dark";
const TERRAIN_SOURCE_ID = "walking-ocho-terrain";
const HILLSHADE_SOURCE_ID = "walking-ocho-hillshade-dem";
const HILLSHADE_LAYER_ID = "walking-ocho-hillshade";
const TERRAIN_TILE_URL = "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png";

export function RouteVisualization({ route, current, currentElevationMeters, progress, activeEventId, mode, spatialDebug = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const [mapReady, setMapReady] = useState(false);
  const [terrainResult, setTerrainResult] = useState<{ routeId: string; elevations: number[] } | null>(null);
  const [inspectedCoordinate, setInspectedCoordinate] = useState<Coordinate | null>(null);
  const terrainElevations = terrainResult?.routeId === route.id ? terrainResult.elevations : null;
  const visualizationRoute = useMemo(() => createVisualizationRoute(route, terrainElevations), [route, terrainElevations]);
  const currentDisplayElevation = useMemo(
    () => terrainElevations ? elevationAtProgress(route, terrainElevations, progress) : currentElevationMeters,
    [currentElevationMeters, progress, route, terrainElevations]
  );
  const initialViewState = useMemo(
    () => fitRouteView(visualizationRoute.coordinates, size.width, size.height, mode, spatialDebug),
    [mode, size.height, size.width, spatialDebug, visualizationRoute.coordinates]
  );
  const reliefReady = mode !== "relief" || terrainElevations !== null;
  const layers = useMemo(
    () => buildRouteLayers({ route: visualizationRoute, progress, current, currentElevationMeters: currentDisplayElevation, activeEventId, mode, spatialDebug }),
    [activeEventId, current, currentDisplayElevation, mode, progress, spatialDebug, visualizationRoute]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.round(entry.contentRect.width));
      const height = Math.max(1, Math.round(entry.contentRect.height));
      setSize((value) => value.width === width && value.height === height ? value : { width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, {
        type: "raster-dem",
        tiles: [TERRAIN_TILE_URL],
        tileSize: DEM_TILE_SIZE,
        maxzoom: DEM_MAX_ZOOM,
        encoding: "terrarium",
        attribution: "Elevation: Mapzen Terrain Tiles via AWS Open Data"
      });
    }
    if (!map.getSource(HILLSHADE_SOURCE_ID)) {
      map.addSource(HILLSHADE_SOURCE_ID, {
        type: "raster-dem",
        tiles: [TERRAIN_TILE_URL],
        tileSize: DEM_TILE_SIZE,
        maxzoom: DEM_MAX_ZOOM,
        encoding: "terrarium",
        attribution: "Elevation: Mapzen Terrain Tiles via AWS Open Data"
      });
    }
    if (!map.getLayer(HILLSHADE_LAYER_ID)) {
      const firstStreetLayer = map.getStyle().layers.find((layer) => layer.type === "line" || layer.type === "symbol")?.id;
      map.addLayer({
        id: HILLSHADE_LAYER_ID,
        type: "hillshade",
        source: HILLSHADE_SOURCE_ID,
        layout: { visibility: "none" },
        paint: {
          "hillshade-shadow-color": "#020504",
          "hillshade-highlight-color": "#5e8f69",
          "hillshade-accent-color": "#193b2b",
          "hillshade-exaggeration": 0.45
        }
      }, firstStreetLayer);
    }

    const relief = mode === "relief";
    map.setCenterClampedToGround(false);
    map.showTileBoundaries = spatialDebug;
    map.setLayoutProperty(HILLSHADE_LAYER_ID, "visibility", relief ? "visible" : "none");
    map.setTerrain(relief ? { source: TERRAIN_SOURCE_ID, exaggeration: 1 } : null);

    if (!relief || terrainElevations) return;
    const sampleTerrain = () => {
      const elevations = route.samples.map((sample) => map.queryTerrainElevation(sample.coordinates));
      const completeElevations = acceptCompleteTerrainElevations(elevations);
      if (completeElevations) setTerrainResult({ routeId: route.id, elevations: completeElevations });
    };
    sampleTerrain();
    map.on("idle", sampleTerrain);
    return () => { map.off("idle", sampleTerrain); };
  }, [mapReady, mode, route.id, route.samples, spatialDebug, terrainElevations]);

  return (
    <div className={`route-visualization visualization-${mode}`} ref={containerRef} role="img" aria-label={`Animated ${modeLabel(mode)} visualization of the replay route`}>
      <DeckGL
        initialViewState={initialViewState}
        controller={{ dragRotate: false, touchRotate: false }}
        layers={reliefReady ? layers : []}
        onClick={(info) => {
          if (spatialDebug && info.coordinate) setInspectedCoordinate([info.coordinate[0], info.coordinate[1]]);
        }}
        getCursor={({ isDragging }) => isDragging ? "grabbing" : "grab"}
      >
        <Map
          ref={mapRef}
          mapStyle={BASEMAP_STYLE}
          attributionControl={{ compact: true }}
          onLoad={() => setMapReady(true)}
          reuseMaps
        />
      </DeckGL>
      {spatialDebug && (
        <output className="spatial-debug-panel">
          <strong>Spatial proof mode</strong>
          <span>WGS84 [longitude, latitude] degrees → deck.gl/MapLibre Web Mercator</span>
          <span>DEM: XYZ · data z0-{DEM_DATA_MAX_ZOOM} · render z{DEM_MAX_ZOOM} · {DEM_TILE_SIZE}px · Terrarium meters</span>
          <span>Camera: bearing 0 · pitch 0 · center elevation 0</span>
          {inspectedCoordinate && <span>Tap: {inspectedCoordinate[0].toFixed(6)}, {inspectedCoordinate[1].toFixed(6)} · tile {formatTile(inspectedCoordinate)}</span>}
        </output>
      )}
    </div>
  );
}

export function fitRouteView(coordinates: Coordinate[], width: number, height: number, mode: VisualizationMode = "current", spatialDebug = false): MapViewState {
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)]
  ];
  const viewport = new WebMercatorViewport({ width, height }).fitBounds(bounds, {
    padding: Math.max(32, Math.min(mode === "relief" ? 105 : 72, Math.min(width, height) * (mode === "relief" ? 0.18 : 0.12))),
    maxZoom: mode === "relief" ? 15 : 17
  });
  return {
    longitude: viewport.longitude,
    latitude: viewport.latitude,
    zoom: viewport.zoom,
    pitch: mode === "relief" && !spatialDebug ? 38 : 0,
    bearing: mode === "relief" && !spatialDebug ? -12 : 0
  };
}

function formatTile(coordinate: Coordinate): string {
  const tile = longitudeLatitudeToXyzTile(coordinate, DEM_MAX_ZOOM);
  return `${tile.z}/${tile.x}/${tile.y}`;
}

function modeLabel(mode: VisualizationMode): string {
  if (mode === "hex-ghost") return "Hex Ghost";
  if (mode === "relief") return "Relief Broadcast";
  return "current map";
}

function elevationAtProgress(route: ReplayRoute, elevations: number[], progress: number): number {
  let low = 0;
  let high = route.samples.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (route.samples[middle].progress < progress) low = middle + 1;
    else high = middle;
  }
  const prior = Math.max(0, low - 1);
  const index = Math.abs(route.samples[prior].progress - progress) <= Math.abs(route.samples[low].progress - progress) ? prior : low;
  return elevations[index];
}
