"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { WebMercatorViewport } from "@deck.gl/core";
import type { MapViewState } from "@deck.gl/core";
import { Map } from "react-map-gl/maplibre";
import { buildRouteLayers, createVisualizationRoute } from "@/lib/visualization/route-layers";
import type { Coordinate, ReplayRoute } from "@/lib/replay-types";

type Props = {
  route: ReplayRoute;
  current: Coordinate;
  progress: number;
  activeEventId?: string;
};

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

export function RouteVisualization({ route, current, progress, activeEventId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const visualizationRoute = useMemo(() => createVisualizationRoute(route), [route]);
  const initialViewState = useMemo(
    () => fitRouteView(visualizationRoute.coordinates, size.width, size.height),
    [size.height, size.width, visualizationRoute.coordinates]
  );
  const layers = useMemo(
    () => buildRouteLayers({ route: visualizationRoute, progress, current, activeEventId }),
    [activeEventId, current, progress, visualizationRoute]
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

  return (
    <div className="route-visualization" ref={containerRef} role="img" aria-label="Animated visualization of the replay route">
      <DeckGL
        initialViewState={initialViewState}
        controller={{ dragRotate: false, touchRotate: false }}
        layers={layers}
        getCursor={({ isDragging }) => isDragging ? "grabbing" : "grab"}
      >
        <Map
          mapStyle={BASEMAP_STYLE}
          attributionControl={{ compact: true }}
          reuseMaps
        />
      </DeckGL>
    </div>
  );
}

export function fitRouteView(coordinates: Coordinate[], width: number, height: number): MapViewState {
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)]
  ];
  const viewport = new WebMercatorViewport({ width, height }).fitBounds(bounds, {
    padding: Math.max(32, Math.min(72, Math.min(width, height) * 0.12)),
    maxZoom: 17
  });
  return {
    longitude: viewport.longitude,
    latitude: viewport.latitude,
    zoom: viewport.zoom,
    pitch: 0,
    bearing: 0
  };
}
