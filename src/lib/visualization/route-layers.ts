import type { LayersList } from "@deck.gl/core";
import { PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Coordinate, ReplayRoute, RouteEvent } from "@/lib/replay-types";

export type VisualizationRoute = {
  coordinates: Coordinate[];
  events: RouteEvent[];
  start: Coordinate;
  finish: Coordinate;
  pathData: PathDatum[];
  endpointData: PointDatum[];
  eventData: EventDatum[];
  elevationPathData: ElevationPathDatum[];
  hexCells: HexCellDatum[];
};

export type VisualizationMode = "current" | "hex-ghost" | "relief";

export type RouteLayerState = {
  route: VisualizationRoute;
  progress: number;
  current: Coordinate;
  currentElevationMeters?: number | null;
  activeEventId?: string;
  mode?: VisualizationMode;
};

type PathDatum = { path: Coordinate[] };
type ElevatedCoordinate = [number, number, number];
type PointDatum = { coordinates: Coordinate; elevatedCoordinates: ElevatedCoordinate; kind: "start" | "finish" };
type EventDatum = { event: RouteEvent; elevatedCoordinates: ElevatedCoordinate };
type ElevationPathDatum = { path: [number, number, number][] };
type HexCellDatum = { polygon: Coordinate[]; routeProgress: number | null };
const RELIEF_ROUTE_OFFSET_METERS = 3;

export function createVisualizationRoute(route: ReplayRoute, terrainElevations: Array<number | null> | null = null): VisualizationRoute {
  const start = route.geometry.coordinates[0];
  const finish = route.geometry.coordinates.at(-1)!;
  const displayElevation = (index: number) => terrainElevations?.[index] ?? route.samples[index]?.elevationMeters;
  return {
    coordinates: route.geometry.coordinates,
    events: route.events,
    start,
    finish,
    pathData: [{ path: route.geometry.coordinates }],
    endpointData: [
      { coordinates: start, elevatedCoordinates: elevate(start, displayElevation(0)), kind: "start" },
      { coordinates: finish, elevatedCoordinates: elevate(finish, displayElevation(route.samples.length - 1)), kind: "finish" }
    ],
    eventData: route.events.map((event) => {
      const sampleIndex = nearestProgressIndex(route, event.routeProgress);
      return { event, elevatedCoordinates: elevate(event.coordinates, displayElevation(sampleIndex)) };
    }),
    elevationPathData: [{
      path: route.samples.map((sample, index) => elevate(sample.coordinates, displayElevation(index)))
    }],
    hexCells: createHexCells(route.geometry.coordinates)
  };
}

function nearestProgressIndex(route: ReplayRoute, progress: number): number {
  let bestIndex = 0;
  let bestDelta = Number.POSITIVE_INFINITY;
  route.samples.forEach((sample, index) => {
    const delta = Math.abs(sample.progress - progress);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = index;
    }
  });
  return bestIndex;
}

export function completedRoutePath(coordinates: Coordinate[], current: Coordinate, progress: number): Coordinate[] {
  const lastIndex = Math.min(coordinates.length - 1, Math.floor(Math.max(0, Math.min(1, progress)) * (coordinates.length - 1)));
  return [...coordinates.slice(0, lastIndex + 1), current];
}

export function buildRouteLayers({ route, progress, current, currentElevationMeters, activeEventId, mode = "current" }: RouteLayerState): LayersList {
  const completedPath: PathDatum[] = [{ path: completedRoutePath(route.coordinates, current, progress) }];
  const activeEvent = route.eventData.find(({ event }) => event.id === activeEventId);
  const currentPosition = mode === "relief" ? elevate(current, currentElevationMeters) : current;

  return [
    mode === "hex-ghost" && new PolygonLayer<HexCellDatum>({
      id: "hex-ghost-territory",
      data: route.hexCells,
      getPolygon: (cell) => cell.polygon,
      filled: true,
      stroked: true,
      getFillColor: (cell) => {
        if (cell.routeProgress === null) return [5, 14, 11, 22];
        return cell.routeProgress <= progress ? [45, 112, 74, 118] : [23, 51, 38, 58];
      },
      getLineColor: (cell) => cell.routeProgress !== null && cell.routeProgress <= progress
        ? [82, 242, 173, 126]
        : [74, 101, 86, 58],
      getLineWidth: 1,
      lineWidthUnits: "pixels",
      pickable: false
    }),
    new PathLayer<PathDatum>({
      id: "route-base-shadow",
      data: mode === "relief" ? route.elevationPathData : route.pathData,
      getPath: (datum) => datum.path,
      getColor: [2, 8, 8, 210],
      getWidth: mode === "relief" ? 15 : 11,
      widthUnits: "pixels",
      capRounded: true,
      jointRounded: true
    }),
    new PathLayer<PathDatum>({
      id: "route-remaining",
      data: mode === "relief" ? route.elevationPathData : route.pathData,
      getPath: (datum) => datum.path,
      getColor: mode === "relief" ? [128, 126, 49, 235] : [91, 112, 105, 220],
      getWidth: 5,
      widthUnits: "pixels",
      capRounded: true,
      jointRounded: true
    }),
    new PathLayer<PathDatum>({
      id: "route-completed",
      data: mode === "relief" ? completedElevationPath(route.elevationPathData[0].path, progress) : completedPath,
      getPath: (datum) => datum.path,
      getColor: [82, 242, 173, 255],
      getWidth: mode === "relief" ? 8 : 6,
      widthUnits: "pixels",
      capRounded: true,
      jointRounded: true
    }),
    new ScatterplotLayer<EventDatum>({
      id: "route-events",
      data: route.eventData,
      getPosition: (datum) => mode === "relief" ? datum.elevatedCoordinates : datum.event.coordinates,
      getRadius: ({ event }) => event.id === activeEventId ? 7 : 4,
      radiusUnits: "pixels",
      getFillColor: ({ event }) => eventColor(event),
      stroked: true,
      getLineColor: [4, 12, 11, 255],
      getLineWidth: 1.5,
      lineWidthUnits: "pixels",
      pickable: false
    }),
    new ScatterplotLayer<PointDatum>({
      id: "route-start-finish",
      data: route.endpointData,
      getPosition: (point) => mode === "relief" ? point.elevatedCoordinates : point.coordinates,
      getRadius: 7,
      radiusUnits: "pixels",
      getFillColor: (point) => point.kind === "start" ? [82, 242, 173, 255] : [246, 248, 247, 255],
      stroked: true,
      getLineColor: [4, 12, 11, 255],
      getLineWidth: 2,
      lineWidthUnits: "pixels"
    }),
    new ScatterplotLayer<Coordinate | ElevatedCoordinate>({
      id: "current-position-halo",
      data: [currentPosition],
      getPosition: (coordinate) => coordinate,
      getRadius: 16,
      radiusUnits: "pixels",
      getFillColor: [82, 242, 173, 54]
    }),
    new ScatterplotLayer<Coordinate | ElevatedCoordinate>({
      id: "current-position",
      data: [currentPosition],
      getPosition: (coordinate) => coordinate,
      getRadius: 7,
      radiusUnits: "pixels",
      getFillColor: [244, 255, 249, 255],
      stroked: true,
      getLineColor: [82, 242, 173, 255],
      getLineWidth: 3,
      lineWidthUnits: "pixels"
    }),
    activeEvent && new TextLayer<EventDatum>({
      id: "active-event-label",
      data: [activeEvent],
      getPosition: (datum) => mode === "relief" ? datum.elevatedCoordinates : datum.event.coordinates,
      getText: ({ event }) => eventLabel(event.type),
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

function elevate([longitude, latitude]: Coordinate, elevationMeters: number | null | undefined): ElevatedCoordinate {
  return [longitude, latitude, Math.max(0, elevationMeters ?? 0) + RELIEF_ROUTE_OFFSET_METERS];
}

function completedElevationPath(path: [number, number, number][], progress: number): ElevationPathDatum[] {
  const lastIndex = Math.min(path.length - 1, Math.floor(Math.max(0, Math.min(1, progress)) * (path.length - 1)));
  return [{ path: path.slice(0, lastIndex + 1) }];
}

function createHexCells(coordinates: Coordinate[]): HexCellDatum[] {
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const span = Math.max(maxLongitude - minLongitude, maxLatitude - minLatitude, 0.001);
  const radius = span / 16;
  const width = Math.sqrt(3) * radius;
  const height = radius * 1.5;
  const cells: HexCellDatum[] = [];

  for (let row = -2; row < 15; row += 1) {
    for (let column = -2; column < 18; column += 1) {
      const center: Coordinate = [
        minLongitude + column * width + (row % 2 === 0 ? 0 : width / 2),
        minLatitude + row * height
      ];
      const nearest = nearestRouteProgress(center, coordinates, radius * 1.18);
      cells.push({ polygon: hexagon(center, radius), routeProgress: nearest });
    }
  }
  return cells;
}

function nearestRouteProgress(center: Coordinate, coordinates: Coordinate[], threshold: number): number | null {
  let nearestIndex = -1;
  let nearestDistance = Number.POSITIVE_INFINITY;
  coordinates.forEach(([longitude, latitude], index) => {
    const distance = Math.hypot(longitude - center[0], latitude - center[1]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestDistance <= threshold ? nearestIndex / Math.max(1, coordinates.length - 1) : null;
}

function hexagon([longitude, latitude]: Coordinate, radius: number): Coordinate[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return [longitude + radius * Math.cos(angle), latitude + radius * Math.sin(angle)] as Coordinate;
  });
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
