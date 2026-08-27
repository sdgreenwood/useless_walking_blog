export type OsmNode = { type: "node"; id: number; lat: number; lon: number };
export type OsmWay = { type: "way"; id: number; nodes: number[]; tags?: Record<string, string> };
export type OsmDocument = { osm3s?: { timestamp_osm_base?: string }; elements: Array<OsmNode | OsmWay | { type: string }> };
type RawEdge = { id: number; a: number; b: number; meters: number };
type Segment = { id: number; a: number; b: number; meters: number; rawEdges: number };

export type RandomWalkGraph = {
  starts: number[];
  offsets: Uint32Array;
  adjacentSegments: Uint32Array;
  segmentA: Uint32Array;
  segmentB: Uint32Array;
  segmentMeters: Float64Array;
  sourceTimestamp: string | null;
  statistics: {
    osmWaysAccepted: number;
    rawEdges: number;
    collapsedSegments: number;
    reachableJunctions: number;
    reachableSegments: number;
    streetKilometers: number;
  };
};

export type RandomWalkResult = {
  seed: number;
  traversals: number;
  distanceKilometers: number;
  revisitTraversals: number;
  revisitShare: number;
  coverageMultiple: number;
  nominalEightHourWalkingDays: number;
  completed: boolean;
  coverageShare: number;
};

export function buildRandomWalkGraph(document: OsmDocument): RandomWalkGraph {
  const nodes = new Map<number, OsmNode>();
  const ways: OsmWay[] = [];
  for (const element of document.elements) {
    if (element.type === "node") nodes.set((element as OsmNode).id, element as OsmNode);
    if (element.type === "way" && isWalkableWay(element as OsmWay)) ways.push(element as OsmWay);
  }

  const rawEdges: RawEdge[] = [];
  const incident = new Map<number, number[]>();
  for (const way of ways) for (let index = 1; index < way.nodes.length; index += 1) {
    const a = way.nodes[index - 1];
    const b = way.nodes[index];
    const from = nodes.get(a);
    const to = nodes.get(b);
    if (!from || !to || a === b) continue;
    const edge = { id: rawEdges.length, a, b, meters: haversine(from, to) };
    rawEdges.push(edge);
    add(incident, a, edge.id);
    add(incident, b, edge.id);
  }

  const junctions = new Set([...incident].filter(([, edges]) => edges.length !== 2).map(([node]) => node));
  const collapsed = collapseSegments(rawEdges, incident, junctions);
  const component = largestComponent(collapsed);
  const segments = collapsed.filter((segment) => component.has(segment.a) && component.has(segment.b));
  if (segments.length === 0) throw new Error("No reachable pedestrian segments were produced.");

  const nodeIds = [...new Set(segments.flatMap((segment) => [segment.a, segment.b]))];
  const nodeIndex = new Map(nodeIds.map((node, index) => [node, index]));
  const adjacency = Array.from({ length: nodeIds.length }, () => [] as number[]);
  const segmentA = new Uint32Array(segments.length);
  const segmentB = new Uint32Array(segments.length);
  const segmentMeters = new Float64Array(segments.length);
  segments.forEach((segment, index) => {
    const a = nodeIndex.get(segment.a)!;
    const b = nodeIndex.get(segment.b)!;
    segmentA[index] = a;
    segmentB[index] = b;
    segmentMeters[index] = segment.meters;
    adjacency[a].push(index);
    adjacency[b].push(index);
  });

  const offsets = new Uint32Array(adjacency.length + 1);
  adjacency.forEach((edges, index) => { offsets[index + 1] = offsets[index] + edges.length; });
  const adjacentSegments = new Uint32Array(offsets.at(-1)!);
  adjacency.forEach((edges, index) => adjacentSegments.set(edges, offsets[index]));
  const starts = adjacency.flatMap((edges, index) => edges.length >= 3 ? [index] : []);
  if (starts.length === 0) throw new Error("No eligible random starting junctions were produced.");

  return {
    starts,
    offsets,
    adjacentSegments,
    segmentA,
    segmentB,
    segmentMeters,
    sourceTimestamp: document.osm3s?.timestamp_osm_base ?? null,
    statistics: {
      osmWaysAccepted: ways.length,
      rawEdges: rawEdges.length,
      collapsedSegments: collapsed.length,
      reachableJunctions: adjacency.length,
      reachableSegments: segments.length,
      streetKilometers: sum(Array.from(segmentMeters)) / 1000
    }
  };
}

export function simulateRandomWalk(graph: RandomWalkGraph, seed: number, maxTraversals = Number.POSITIVE_INFINITY): RandomWalkResult {
  const random = mulberry32(seed);
  let node = graph.starts[Math.floor(random() * graph.starts.length)];
  const visited = new Uint8Array(graph.segmentMeters.length);
  let unique = 0;
  let traversals = 0;
  let distanceMeters = 0;
  while (unique < visited.length && traversals < maxTraversals) {
    const start = graph.offsets[node];
    const count = graph.offsets[node + 1] - start;
    const segment = graph.adjacentSegments[start + Math.floor(random() * count)];
    if (visited[segment] === 0) {
      visited[segment] = 1;
      unique += 1;
    }
    traversals += 1;
    distanceMeters += graph.segmentMeters[segment];
    node = graph.segmentA[segment] === node ? graph.segmentB[segment] : graph.segmentA[segment];
  }
  const streetKilometers = graph.statistics.streetKilometers;
  const distanceKilometers = distanceMeters / 1000;
  return {
    seed,
    traversals,
    distanceKilometers,
    revisitTraversals: traversals - visited.length,
    revisitShare: (traversals - visited.length) / traversals,
    coverageMultiple: distanceKilometers / streetKilometers,
    nominalEightHourWalkingDays: distanceKilometers / 4.8 / 8,
    completed: unique === visited.length,
    coverageShare: unique / visited.length
  };
}

export function summarizeRandomWalks(results: RandomWalkResult[]) {
  if (results.length === 0) throw new Error("At least one simulation result is required.");
  const ordered = [...results].sort((a, b) => a.distanceKilometers - b.distanceKilometers);
  return {
    runs: results.length,
    completionRate: results.filter((result) => result.completed).length / results.length,
    fast: quantile(ordered, 0.1),
    typical: quantile(ordered, 0.5),
    slow: quantile(ordered, 0.9),
    unusuallySlow: quantile(ordered, 0.99)
  };
}

export function isWalkableWay(way: OsmWay): boolean {
  const tags = way.tags ?? {};
  const highway = tags.highway;
  if (!highway || tags.area === "yes") return false;
  if (["motorway", "motorway_link", "trunk", "trunk_link", "raceway", "construction", "proposed", "abandoned", "elevator"].includes(highway)) return false;
  if (["no", "private"].includes(tags.access) || ["no", "private"].includes(tags.foot)) return false;
  return !(tags.bridge && tags.bridge !== "no");
}

function collapseSegments(edges: RawEdge[], incident: Map<number, number[]>, junctions: Set<number>): Segment[] {
  const visited = new Uint8Array(edges.length);
  const segments: Segment[] = [];
  for (const start of junctions) for (const firstId of incident.get(start) ?? []) {
    if (visited[firstId]) continue;
    let current = start;
    let edgeId = firstId;
    let meters = 0;
    let rawCount = 0;
    while (true) {
      const edge = edges[edgeId];
      visited[edgeId] = 1;
      meters += edge.meters;
      rawCount += 1;
      const next = edge.a === current ? edge.b : edge.a;
      if (junctions.has(next)) {
        segments.push({ id: segments.length, a: start, b: next, meters, rawEdges: rawCount });
        break;
      }
      const choices = (incident.get(next) ?? []).filter((candidate) => candidate !== edgeId);
      if (choices.length !== 1 || visited[choices[0]]) break;
      current = next;
      edgeId = choices[0];
    }
  }
  return segments;
}

function largestComponent(segments: Segment[]): Set<number> {
  const graph = new Map<number, number[]>();
  for (const segment of segments) {
    add(graph, segment.a, segment.b);
    add(graph, segment.b, segment.a);
  }
  let largest = new Set<number>();
  const unseen = new Set(graph.keys());
  while (unseen.size) {
    const first = unseen.values().next().value as number;
    const component = new Set([first]);
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

function haversine(a: OsmNode, b: OsmNode): number {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians;
  const dLon = (b.lon - a.lon) * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dLon / 2) ** 2;
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

function quantile<T>(values: T[], value: number): T { return values[Math.floor((values.length - 1) * value)]; }
function sum(values: number[]): number { return values.reduce((total, value) => total + value, 0); }
function add(map: Map<number, number[]>, key: number, value: number): void { map.set(key, [...(map.get(key) ?? []), value]); }
