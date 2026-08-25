"use client";

import { useEffect, useRef } from "react";
import maplibregl, { GeoJSONSource, LngLatBounds } from "maplibre-gl";
import type { Coordinate } from "@/lib/replay-types";

type Props = { coordinates: Coordinate[]; current: Coordinate; eventCoordinates: Coordinate[]; progress: number; reducedMotion: boolean };

const STYLE = "https://tiles.openfreemap.org/styles/dark";

export function RouteMap({ coordinates, current, eventCoordinates, progress, reducedMotion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const bounds = coordinates.reduce(
      (value, coordinate) => value.extend(coordinate),
      new LngLatBounds(coordinates[0], coordinates[0])
    );
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      bounds,
      fitBoundsOptions: { padding: 56 },
      attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } }
      });
      map.addLayer({
        id: "route-shadow",
        type: "line",
        source: "route",
        paint: { "line-color": "#07100f", "line-width": 9, "line-opacity": 0.75 }
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: { "line-color": "#42514c", "line-width": 4 }
      });
      map.addSource("completed-route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [coordinates[0], coordinates[0]] } }
      });
      map.addLayer({
        id: "completed-route-line",
        type: "line",
        source: "completed-route",
        paint: { "line-color": "#52f2ad", "line-width": 4 }
      });
      map.addSource("route-events", {
        type: "geojson",
        data: { type: "MultiPoint", coordinates: eventCoordinates }
      });
      map.addLayer({
        id: "route-events",
        type: "circle",
        source: "route-events",
        paint: { "circle-radius": 3, "circle-color": "#9aaca5", "circle-stroke-color": "#07100f", "circle-stroke-width": 1 }
      });
      map.addSource("endpoints", {
        type: "geojson",
        data: { type: "MultiPoint", coordinates: [coordinates[0], coordinates.at(-1)!] }
      });
      map.addLayer({
        id: "endpoints",
        type: "circle",
        source: "endpoints",
        paint: { "circle-radius": 5, "circle-color": "#f4fff9", "circle-stroke-color": "#52f2ad", "circle-stroke-width": 2 }
      });
      map.addSource("position", {
        type: "geojson",
        data: { type: "Point", coordinates: coordinates[0] }
      });
      map.addLayer({
        id: "position-halo",
        type: "circle",
        source: "position",
        paint: { "circle-radius": 13, "circle-color": "#52f2ad", "circle-opacity": 0.22 }
      });
      map.addLayer({
        id: "position-dot",
        type: "circle",
        source: "position",
        paint: { "circle-radius": 6, "circle-color": "#f4fff9", "circle-stroke-color": "#52f2ad", "circle-stroke-width": 3 }
      });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates, eventCoordinates]);

  useEffect(() => {
    const source = mapRef.current?.getSource("position") as GeoJSONSource | undefined;
    source?.setData({ type: "Point", coordinates: current });
    const completed = mapRef.current?.getSource("completed-route") as GeoJSONSource | undefined;
    const lastCompleteIndex = Math.floor(progress * (coordinates.length - 1));
    completed?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [...coordinates.slice(0, lastCompleteIndex + 1), current] }
    });
    if (!reducedMotion) mapRef.current?.easeTo({ center: current, duration: 450 });
  }, [coordinates, current, progress, reducedMotion]);

  return <div className="route-map" ref={containerRef} aria-label="Map of the replay route" />;
}
