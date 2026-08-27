import fs from "node:fs";
import { buildReplay } from "../src/lib/pipeline/build-replay";
import type { NormalizedRouteSample } from "../src/lib/domain/normalized-route";
import type { Commentary, Coordinate } from "../src/lib/replay-types";

type OsmNode = { type: "node"; id: number; lat: number; lon: number };
type OsmWay = { type: "way"; id: number; nodes: number[]; tags?: Record<string, string> };
type OsmDocument = { osm3s?: { timestamp_osm_base?: string }; elements: Array<OsmNode | OsmWay | { type: string }> };
type RawEdge = { id: number; a: number; b: number; meters: number; wayId: number };
type Segment = { id: number; a: number; b: number; meters: number; rawEdges: number; nodeIds: number[] };

const args = Object.fromEntries(process.argv.slice(2).map((value) => {
  const match = value.match(/^--([^=]+)=(.+)$/);
  if (!match) throw new Error(`Arguments must use --key=value: ${value}`);
  return [match[1], match[2]];
}));
const osmPath = args.osm;
if (!osmPath) throw new Error("Missing --osm=/path/to/overpass.json");
const runs = integer(args.runs ?? "100", "runs");
const seed = integer(args.seed ?? "20260826", "seed");
const exampleOutput = args["example-output"];
const exampleSeed = integer(args["example-seed"] ?? "20261178", "example-seed");
const exampleKilometers = positive(args["example-km"] ?? "42.195", "example-km");

const document = JSON.parse(fs.readFileSync(osmPath, "utf8")) as OsmDocument;
const nodes = new Map<number, OsmNode>();
const sourceWays: OsmWay[] = [];
for (const element of document.elements) {
  if (element.type === "node") nodes.set((element as OsmNode).id, element as OsmNode);
  if (element.type === "way") sourceWays.push(element as OsmWay);
}
const ways = sourceWays.filter(walkable);

const rawEdges: RawEdge[] = [];
const incident = new Map<number, number[]>();
for (const way of ways) {
  for (let index = 1; index < way.nodes.length; index += 1) {
    const a = way.nodes[index - 1];
    const b = way.nodes[index];
    const from = nodes.get(a);
    const to = nodes.get(b);
    if (!from || !to || a === b) continue;
    const edge: RawEdge = { id: rawEdges.length, a, b, meters: haversine(from, to), wayId: way.id };
    rawEdges.push(edge);
    addIncident(incident, a, edge.id);
    addIncident(incident, b, edge.id);
  }
}

const junctions = new Set([...incident].filter(([, edges]) => edges.length !== 2).map(([node]) => node));
const segments = collapseSegments(rawEdges, incident, junctions);
const component = largestComponent(segments);
const graphSegments = segments.filter((segment) => component.has(segment.a) && component.has(segment.b));
const adjacency = new Map<number, number[]>();
for (const segment of graphSegments) {
  addIncident(adjacency, segment.a, segment.id);
  addIncident(adjacency, segment.b, segment.id);
}
const segmentById = new Map(graphSegments.map((segment) => [segment.id, segment]));
const starts = [...adjacency].filter(([, edges]) => edges.length >= 3).map(([node]) => node);
if (starts.length === 0 || graphSegments.length === 0) throw new Error("No connected pedestrian graph was produced.");

const results = Array.from({ length: runs }, (_, run) => simulate(seed + run, starts, adjacency, segmentById, graphSegments.length));
const ordered = [...results].sort((a, b) => a.distanceKilometers - b.distanceKilometers);
const streetKilometers = sum(graphSegments.map((edge) => edge.meters)) / 1000;
const summary = {
  generatedAt: new Date().toISOString(),
  sourceTimestamp: document.osm3s?.timestamp_osm_base ?? null,
  assumptions: {
    coverage: "every undirected street segment in the largest reachable component traversed at least once",
    choice: "uniform among incident segments, including the segment just used",
    start: "uniform random junction with at least three incident segments",
    water: "ferries, non-highway links, and every OSM way tagged as a bridge are excluded; HPI is therefore zero by construction",
    walkable: "public highway ways excluding motorway/trunk families and explicit foot/access prohibitions"
  },
  network: {
    osmWaysAccepted: ways.length,
    rawEdges: rawEdges.length,
    collapsedSegments: segments.length,
    rawEdgesRepresented: sum(segments.map((edge) => edge.rawEdges)),
    reachableJunctions: adjacency.size,
    reachableSegments: graphSegments.length,
    reachableRawEdges: sum(graphSegments.map((edge) => edge.rawEdges)),
    streetKilometers
  },
  simulation: {
    runs,
    seed,
    fast: describe(pick(ordered, 0.1), streetKilometers),
    typical: describe(pick(ordered, 0.5), streetKilometers),
    slow: describe(pick(ordered, 0.9), streetKilometers),
    unusuallySlow: describe(pick(ordered, 0.99), streetKilometers)
  }
};
console.log(JSON.stringify(summary, null, 2));
if (exampleOutput) writeExampleReplay(exampleOutput, exampleSeed, exampleKilometers * 1000);

function walkable(way: OsmWay): boolean {
  const tags = way.tags ?? {};
  const highway = tags.highway;
  if (!highway || tags.area === "yes") return false;
  if (["motorway", "motorway_link", "trunk", "trunk_link", "raceway", "construction", "proposed", "abandoned", "elevator"].includes(highway)) return false;
  if (["no", "private"].includes(tags.access) || ["no", "private"].includes(tags.foot)) return false;
  if (tags.bridge && tags.bridge !== "no") return false;
  return true;
}

function collapseSegments(edges: RawEdge[], incident: Map<number, number[]>, junctions: Set<number>): Segment[] {
  const visited = new Uint8Array(edges.length);
  const segments: Segment[] = [];
  for (const start of junctions) {
    for (const firstId of incident.get(start) ?? []) {
      if (visited[firstId]) continue;
      let current = start;
      let edgeId = firstId;
      let meters = 0;
      let rawCount = 0;
      const nodeIds = [start];
      while (true) {
        const edge = edges[edgeId];
        visited[edgeId] = 1;
        meters += edge.meters;
        rawCount += 1;
        const next = edge.a === current ? edge.b : edge.a;
        nodeIds.push(next);
        if (junctions.has(next)) {
          segments.push({ id: segments.length, a: start, b: next, meters, rawEdges: rawCount, nodeIds });
          break;
        }
        const choices = (incident.get(next) ?? []).filter((candidate) => candidate !== edgeId);
        if (choices.length !== 1 || visited[choices[0]]) break;
        current = next;
        edgeId = choices[0];
      }
    }
  }
  return segments;
}

function largestComponent(segments: Segment[]): Set<number> {
  const graph = new Map<number, number[]>();
  for (const segment of segments) {
    addNeighbor(graph, segment.a, segment.b);
    addNeighbor(graph, segment.b, segment.a);
  }
  let largest = new Set<number>();
  const unseen = new Set(graph.keys());
  while (unseen.size) {
    const first = unseen.values().next().value as number;
    const component = new Set<number>([first]);
    const stack = [first];
    unseen.delete(first);
    while (stack.length) {
      const node = stack.pop()!;
      for (const neighbor of graph.get(node) ?? []) if (unseen.delete(neighbor)) {
        component.add(neighbor);
        stack.push(neighbor);
      }
    }
    if (component.size > largest.size) largest = component;
  }
  return largest;
}

function simulate(seed: number, starts: number[], adjacency: Map<number, number[]>, segmentById: Map<number, Segment>, edgeCount: number) {
  const random = mulberry32(seed);
  let node = starts[Math.floor(random() * starts.length)];
  const visited = new Set<number>();
  let traversals = 0;
  let distanceMeters = 0;
  while (visited.size < edgeCount) {
    const choices = adjacency.get(node)!;
    const edge = segmentById.get(choices[Math.floor(random() * choices.length)])!;
    visited.add(edge.id);
    traversals += 1;
    distanceMeters += edge.meters;
    node = edge.a === node ? edge.b : edge.a;
  }
  return {
    seed,
    traversals,
    distanceKilometers: distanceMeters / 1000,
    revisitTraversals: traversals - edgeCount,
    revisitShare: (traversals - edgeCount) / traversals,
    nominalWalkingHoursAt4_8Kph: distanceMeters / 4800
  };
}

function writeExampleReplay(outputPath: string, seed: number, targetMeters: number): void {
  const random = mulberry32(seed);
  let currentNode = starts[Math.floor(random() * starts.length)];
  const visited = new Set<number>();
  const samples: NormalizedRouteSample[] = [sampleForNode(currentNode, 0, 0)];
  const snapshots: Array<{ distanceMeters: number; traversals: number; uniqueSegments: number }> = [];
  let distanceMeters = 0;
  let traversals = 0;
  while (distanceMeters < targetMeters) {
    const choices = adjacency.get(currentNode)!;
    const segment = segmentById.get(choices[Math.floor(random() * choices.length)])!;
    const forward = segment.a === currentNode;
    const path = forward ? segment.nodeIds : [...segment.nodeIds].reverse();
    for (let index = 1; index < path.length; index += 1) {
      const prior = nodes.get(path[index - 1])!;
      const current = nodes.get(path[index])!;
      distanceMeters += haversine(prior, current);
      samples.push(sampleForNode(path[index], samples.length, distanceMeters));
    }
    visited.add(segment.id);
    traversals += 1;
    snapshots.push({ distanceMeters, traversals, uniqueSegments: visited.size });
    currentNode = forward ? segment.b : segment.a;
  }

  const built = buildReplay({
    schemaVersion: 1,
    source: { kind: "simulation", schemaVersion: 1 },
    activityType: "random_walk_simulation",
    durationSeconds: distanceMeters / (4800 / 3600),
    segments: [{ index: 0, samples }],
    issues: []
  }, {
    id: "random-walk-san-francisco-marathon",
    name: "The First Marathon of a 12,028-Mile Problem",
    createdAt: "2026-08-27T01:28:35.000Z",
    trimStartMeters: 0,
    trimEndMeters: 0
  });
  built.replay.route.commentary = exampleCommentary(built.replay.route.events, snapshots, built.replay.route.distanceMeters);
  fs.writeFileSync(outputPath, `${JSON.stringify(built.replay, null, 2)}\n`, { flag: "wx" });
  console.error(`Example replay written: ${outputPath}`);
}

function sampleForNode(nodeId: number, sequence: number, distanceMeters: number): NormalizedRouteSample {
  const node = nodes.get(nodeId)!;
  return {
    sequence,
    elapsedSeconds: distanceMeters / (4800 / 3600),
    coordinates: [node.lon, node.lat] as Coordinate,
    elevationMeters: null,
    horizontalAccuracyMeters: null,
    verticalAccuracyMeters: null
  };
}

function exampleCommentary(events: Array<{ id: string; routeProgress: number }>, snapshots: Array<{ distanceMeters: number; traversals: number; uniqueSegments: number }>, totalMeters: number): Commentary[] {
  const targets = [0, 0.12, 0.23, 0.35, 0.48, 0.5, 0.64, 0.77, 0.9, 1];
  const used = new Set<string>();
  return targets.map((progress, index) => {
    const event = [...events]
      .filter((candidate) => !used.has(candidate.id))
      .sort((a, b) => Math.abs(a.routeProgress - progress) - Math.abs(b.routeProgress - progress))[0];
    used.add(event.id);
    const snapshot = snapshots.find((candidate) => candidate.distanceMeters >= totalMeters * progress) ?? snapshots.at(-1)!;
    const revisitShare = snapshot.traversals === 0 ? 0 : (snapshot.traversals - snapshot.uniqueSegments) / snapshot.traversals;
    const texts = [
      "Seed 20261178 is underway. At every intersection, the walker will make a fair and completely uninformed decision.",
      `The revisit desk is open: ${percent(revisitShare)} of segment choices so far have returned to previously covered ground.`,
      "No destination has been selected because destinations are a form of planning, and planning has been disallowed.",
      `Race control reports ${snapshot.uniqueSegments} distinct segments acquired. The walker remembers none of them.`,
      "This is not a route through San Francisco so much as an argument with adjacency.",
      "Halfway through the excerpt. The full median problem remains approximately twelve thousand miles long.",
      `Revisit rate: ${percent(revisitShare)}. Progress is occurring, but largely in an emotional sense.`,
      "HPI remains zero. Every bridge-tagged way was removed before the walker could develop maritime ambitions.",
      "OH MY GOODNESS, THE WALKER IS ALMOST AT THE MARATHON MARK—AND STILL HAS NO IDEA WHERE HE IS GOING!!!!!",
      "The first random marathon is complete. The representative full seed has roughly 19,314 kilometers left to wander."
    ];
    return {
      eventId: event.id,
      displayProgress: progress === 0 || progress === 1 ? undefined : progress,
      speaker: (["play_by_play", "stats_desk", "color", "field_reporter"] as const)[index % 4],
      text: texts[index],
      importance: index === 0 || index === 5 || index === 9 ? 3 : 2,
      source: "deterministic"
    };
  });
}

function percent(value: number): string { return `${(value * 100).toFixed(1)}%`; }

function pick<T>(values: T[], quantile: number): T {
  return values[Math.min(values.length - 1, Math.floor((values.length - 1) * quantile))];
}
function describe(result: ReturnType<typeof simulate>, streetKilometers: number) {
  return {
    ...result,
    coverageMultiple: result.distanceKilometers / streetKilometers,
    nominalEightHourWalkingDays: result.nominalWalkingHoursAt4_8Kph / 8
  };
}
function sum(values: number[]): number { return values.reduce((total, value) => total + value, 0); }
function addIncident(map: Map<number, number[]>, node: number, edge: number): void { map.set(node, [...(map.get(node) ?? []), edge]); }
function addNeighbor(map: Map<number, number[]>, node: number, neighbor: number): void { map.set(node, [...(map.get(node) ?? []), neighbor]); }
function haversine(a: OsmNode, b: OsmNode): number {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians;
  const dLon = (b.lon - a.lon) * radians;
  const lat1 = a.lat * radians;
  const lat2 = b.lat * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371008.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function integer(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`--${name} must be a positive integer`);
  return parsed;
}
function positive(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`--${name} must be positive`);
  return parsed;
}
