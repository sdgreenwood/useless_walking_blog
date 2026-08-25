import type { LayersList } from "@deck.gl/core";
import { PathLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Coordinate, ReplayRoute, RouteEvent } from "@/lib/replay-types";

export type VisualizationRoute = {
  coordinates: Coordinate[];
  events: RouteEvent[];
  start: Coordinate;
  finish: Coordinate;
  pathData: PathDatum[];
  endpointData: PointDatum[];
};

export type RouteLayerState = {
  route: VisualizationRoute;
  progress: number;
  current: Coordinate;
  activeEventId?: string;
};

type PathDatum = { path: Coordinate[] };
type PointDatum = { coordinates: Coordinate; kind: "start" | "finish" };

export function createVisualizationRoute(route: ReplayRoute): VisualizationRoute {
  const start = route.geometry.coordinates[0];
  const finish = route.geometry.coordinates.at(-1)!;
  return {
    coordinates: route.geometry.coordinates,
    events: route.events,
    start,
    finish,
    pathData: [{ path: route.geometry.coordinates }],
    endpointData: [
      { coordinates: start, kind: "start" },
      { coordinates: finish, kind: "finish" }
    ]
  };
}

export function completedRoutePath(coordinates: Coordinate[], current: Coordinate, progress: number): Coordinate[] {
  const lastIndex = Math.min(coordinates.length - 1, Math.floor(Math.max(0, Math.min(1, progress)) * (coordinates.length - 1)));
  return [...coordinates.slice(0, lastIndex + 1), current];
}

export function buildRouteLayers({ route, progress, current, activeEventId }: RouteLayerState): LayersList {
  const completedPath: PathDatum[] = [{ path: completedRoutePath(route.coordinates, current, progress) }];
  const activeEvent = route.events.find((event) => event.id === activeEventId);

  return [
    new PathLayer<PathDatum>({
      id: "route-base-shadow",
      data: route.pathData,
      getPath: (datum) => datum.path,
      getColor: [2, 8, 8, 210],
      getWidth: 11,
      widthUnits: "pixels",
      capRounded: true,
      jointRounded: true
    }),
    new PathLayer<PathDatum>({
      id: "route-remaining",
      data: route.pathData,
      getPath: (datum) => datum.path,
      getColor: [91, 112, 105, 220],
      getWidth: 5,
      widthUnits: "pixels",
      capRounded: true,
      jointRounded: true
    }),
    new PathLayer<PathDatum>({
      id: "route-completed",
      data: completedPath,
      getPath: (datum) => datum.path,
      getColor: [82, 242, 173, 255],
      getWidth: 6,
      widthUnits: "pixels",
      capRounded: true,
      jointRounded: true
    }),
    new ScatterplotLayer<RouteEvent>({
      id: "route-events",
      data: route.events,
      getPosition: (event) => event.coordinates,
      getRadius: (event) => event.id === activeEventId ? 7 : 4,
      radiusUnits: "pixels",
      getFillColor: (event) => eventColor(event),
      stroked: true,
      getLineColor: [4, 12, 11, 255],
      getLineWidth: 1.5,
      lineWidthUnits: "pixels",
      pickable: false
    }),
    new ScatterplotLayer<PointDatum>({
      id: "route-start-finish",
      data: route.endpointData,
      getPosition: (point) => point.coordinates,
      getRadius: 7,
      radiusUnits: "pixels",
      getFillColor: (point) => point.kind === "start" ? [82, 242, 173, 255] : [246, 248, 247, 255],
      stroked: true,
      getLineColor: [4, 12, 11, 255],
      getLineWidth: 2,
      lineWidthUnits: "pixels"
    }),
    new ScatterplotLayer<Coordinate>({
      id: "current-position-halo",
      data: [current],
      getPosition: (coordinate) => coordinate,
      getRadius: 16,
      radiusUnits: "pixels",
      getFillColor: [82, 242, 173, 54]
    }),
    new ScatterplotLayer<Coordinate>({
      id: "current-position",
      data: [current],
      getPosition: (coordinate) => coordinate,
      getRadius: 7,
      radiusUnits: "pixels",
      getFillColor: [244, 255, 249, 255],
      stroked: true,
      getLineColor: [82, 242, 173, 255],
      getLineWidth: 3,
      lineWidthUnits: "pixels"
    }),
    activeEvent && new TextLayer<RouteEvent>({
      id: "active-event-label",
      data: [activeEvent],
      getPosition: (event) => event.coordinates,
      getText: (event) => eventLabel(event.type),
      getColor: [230, 244, 238, 255],
      getBackgroundColor: [7, 14, 14, 225],
      background: true,
      backgroundPadding: [7, 4],
      getPixelOffset: [0, -22],
      getSize: 11,
      sizeUnits: "pixels",
      getTextAnchor: "middle",
      getAlignmentBaseline: "bottom",
      fontWeight: 700
    })
  ].filter(Boolean) as LayersList;
}

function eventColor(event: RouteEvent): [number, number, number, number] {
  if (event.type === "finish") return [246, 248, 247, 255];
  if (event.type.includes("climb") || event.type.includes("steep")) return [242, 201, 76, 255];
  if (event.type.includes("summit") || event.type.includes("high_point")) return [120, 196, 255, 255];
  if (event.type === "halfway") return [82, 242, 173, 255];
  return event.importance >= 2 ? [190, 214, 205, 255] : [113, 132, 125, 220];
}

function eventLabel(type: string): string {
  return type.replaceAll("_", " ").toUpperCase();
}
