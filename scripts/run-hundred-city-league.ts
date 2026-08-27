import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Worker } from "node:worker_threads";
import { HUNDRED_CITY_ROSTER } from "../src/lib/research/hundred-city-roster";
import { buildRandomWalkGraph, simulateRandomWalk, summarizeRandomWalks, type OsmDocument } from "../src/lib/research/random-walk-simulator";

type GeocodeResult = { osm_type: string; osm_id: number; display_name: string };
type CityResult = {
  city: (typeof HUNDRED_CITY_ROSTER)[number];
  boundary: { osmType: string; osmId: number; displayName: string };
  graph: ReturnType<typeof buildRandomWalkGraph>["statistics"] & { sourceTimestamp: string | null };
  simulation: ReturnType<typeof summarizeRandomWalks>;
};

const args = Object.fromEntries(process.argv.slice(2).map((value) => {
  const match = value.match(/^--([^=]+)=(.+)$/);
  if (!match) throw new Error(`Arguments must use --key=value: ${value}`);
  return [match[1], match[2]];
}));
const runs = positiveInteger(args.runs ?? "25", "runs");
const traversalCapMultiple = positiveInteger(args["traversal-cap"] ?? "250", "traversal-cap");
const first = positiveInteger(args.from ?? "1", "from");
const last = positiveInteger(args.to ?? "100", "to");
const outputDirectory = path.resolve(args["output-dir"] ?? "private-imports/hundred-city-league");
const aggregateOutput = path.resolve(args.output ?? "data/research/hundred-city-league.json");
if (first > last || last > 100) throw new Error("Expected 1 <= --from <= --to <= 100");
fs.mkdirSync(outputDirectory, { recursive: true });

async function main(): Promise<void> {
for (const city of HUNDRED_CITY_ROSTER.slice(first - 1, last)) {
  const cityPath = path.join(outputDirectory, `${String(city.populationRank).padStart(3, "0")}-${slug(city.name)}.json`);
  if (fs.existsSync(cityPath)) {
    console.error(`[${city.populationRank}/100] ${city.name}: already complete`);
    continue;
  }
  console.error(`[${city.populationRank}/100] ${city.name}: resolving boundary`);
  const boundary = await resolveBoundary(city.name, city.state);
  console.error(`[${city.populationRank}/100] ${city.name}: downloading OSM graph`);
  const osm = await fetchOsm(boundary);
  console.error(`[${city.populationRank}/100] ${city.name}: building graph`);
  const graph = buildRandomWalkGraph(osm);
  console.error(`[${city.populationRank}/100] ${city.name}: running ${runs} seeds across ${graph.statistics.reachableSegments.toLocaleString()} segments`);
  const seedBase = 20270000 + city.populationRank * 10_000;
  const seeds = Array.from({ length: runs }, (_, index) => seedBase + index);
  const results = await simulateInParallel(graph, seeds, graph.statistics.reachableSegments * traversalCapMultiple);
  const result: CityResult = {
    city,
    boundary: { osmType: boundary.osm_type, osmId: boundary.osm_id, displayName: boundary.display_name },
    graph: { ...graph.statistics, sourceTimestamp: graph.sourceTimestamp },
    simulation: summarizeRandomWalks(results)
  };
  fs.writeFileSync(cityPath, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.error(`[${city.populationRank}/100] ${city.name}: complete; median ${result.simulation.typical.coverageMultiple.toFixed(1)}×`);
}

const completed = fs.readdirSync(outputDirectory).filter((name) => name.endsWith(".json")).sort().map((name) => JSON.parse(fs.readFileSync(path.join(outputDirectory, name), "utf8")) as CityResult);
if (completed.length === 100) {
  const ranked = [...completed].sort((a, b) =>
    a.simulation.completionRate - b.simulation.completionRate
    || b.simulation.typical.coverageMultiple - a.simulation.typical.coverageMultiple
  );
  const artifact = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    roster: {
      source: "U.S. Census Bureau Vintage 2025 incorporated places ranked by July 1, 2025 population",
      sourceUrl: "https://www.census.gov/data/tables/time-series/demo/popest/2020s-total-cities-and-towns.html",
      count: 100
    },
    assumptions: {
      coverage: "every undirected decision-to-decision segment in the largest reachable component",
      choice: "uniform among all incident segments, including the segment just used",
      start: "uniform among junctions with at least three incident segments",
      water: "ferries, non-highway links, and every bridge-tagged way excluded; HPI zero",
      ranking: "lowest completion rate first, then descending median traversal distance divided by unique network length"
    },
    runsPerCity: runs,
    traversalCapMultiple,
    cities: ranked.map((result, index) => ({ difficultyRank: index + 1, ...result }))
  };
  fs.mkdirSync(path.dirname(aggregateOutput), { recursive: true });
  fs.writeFileSync(aggregateOutput, `${JSON.stringify(artifact, null, 2)}\n`);
  console.error(`League artifact written: ${aggregateOutput}`);
} else {
  console.error(`${completed.length}/100 cities complete; aggregate remains unpublished.`);
}
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function resolveBoundary(name: string, state: string): Promise<GeocodeResult> {
  const geocodeName = ({ "Urban Honolulu": "Honolulu", "Boise": "Boise City" } as Record<string, string>)[name] ?? name;
  const query = new URLSearchParams({ city: geocodeName, state, country: "USA", format: "jsonv2", limit: "5" });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, { headers: { "User-Agent": "WalkingOchoResearch/1.0 (github.com/sdgreenwood/useless_walking_blog)" } });
  if (!response.ok) throw new Error(`Nominatim ${response.status} for ${name}, ${state}`);
  const options = await response.json() as GeocodeResult[];
  const boundary = options.find((option) => option.osm_type === "relation") ?? options[0];
  if (!boundary) throw new Error(`No OSM boundary found for ${name}, ${state}`);
  return boundary;
}

async function fetchOsm(boundary: GeocodeResult): Promise<OsmDocument> {
  if (boundary.osm_type !== "relation") throw new Error(`Expected relation boundary, received ${boundary.osm_type}`);
  const areaId = 3_600_000_000 + boundary.osm_id;
  const query = `[out:json][timeout:600];area(${areaId})->.a;way(area.a)["highway"];out body;>;out skel qt;`;
  const body = new URLSearchParams({ data: query });
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter"
  ];
  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const endpoint = endpoints[attempt % endpoints.length];
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "WalkingOchoResearch/1.0" },
      body
    });
    if (response.ok) return response.json() as Promise<OsmDocument>;
    lastStatus = response.status;
    if (![429, 500, 502, 503, 504].includes(response.status)) break;
    await delay(15_000 + attempt * 5_000);
  }
  throw new Error(`Overpass ${lastStatus} for relation ${boundary.osm_id}`);
}

async function simulateInParallel(graph: ReturnType<typeof buildRandomWalkGraph>, seeds: number[], maxTraversals: number) {
  const workerCount = Math.min(seeds.length, Math.max(1, Math.min(8, os.availableParallelism())));
  if (workerCount === 1) return seeds.map((seed) => simulateRandomWalk(graph, seed, maxTraversals));
  const groups = Array.from({ length: workerCount }, () => [] as number[]);
  seeds.forEach((seed, index) => groups[index % workerCount].push(seed));
  const workerSource = `
    const { parentPort, workerData } = require("node:worker_threads");
    function randomFor(seed) {
      let state = seed >>> 0;
      return () => {
        state += 0x6d2b79f5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }
    const graph = workerData.graph;
    const results = workerData.seeds.map((seed) => {
      const random = randomFor(seed);
      let node = graph.starts[Math.floor(random() * graph.starts.length)];
      const visited = new Uint8Array(graph.segmentMeters.length);
      let unique = 0, traversals = 0, distanceMeters = 0;
      while (unique < visited.length && traversals < workerData.maxTraversals) {
        const start = graph.offsets[node];
        const count = graph.offsets[node + 1] - start;
        const segment = graph.adjacentSegments[start + Math.floor(random() * count)];
        if (visited[segment] === 0) { visited[segment] = 1; unique += 1; }
        traversals += 1;
        distanceMeters += graph.segmentMeters[segment];
        node = graph.segmentA[segment] === node ? graph.segmentB[segment] : graph.segmentA[segment];
      }
      const distanceKilometers = distanceMeters / 1000;
      return { seed, traversals, distanceKilometers, revisitTraversals: traversals - visited.length,
        revisitShare: (traversals - visited.length) / traversals,
        coverageMultiple: distanceKilometers / graph.streetKilometers,
        nominalEightHourWalkingDays: distanceKilometers / 4.8 / 8,
        completed: unique === visited.length, coverageShare: unique / visited.length };
    });
    parentPort.postMessage(results);
  `;
  const portableGraph = {
    starts: graph.starts,
    offsets: graph.offsets,
    adjacentSegments: graph.adjacentSegments,
    segmentA: graph.segmentA,
    segmentB: graph.segmentB,
    segmentMeters: graph.segmentMeters,
    streetKilometers: graph.statistics.streetKilometers
  };
  const batches = await Promise.all(groups.map((workerSeeds) => new Promise<ReturnType<typeof simulateRandomWalk>[]>((resolve, reject) => {
    const worker = new Worker(workerSource, { eval: true, workerData: { graph: portableGraph, seeds: workerSeeds, maxTraversals } });
    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", (code) => { if (code !== 0) reject(new Error(`Simulation worker exited ${code}`)); });
  })));
  return batches.flat().sort((a, b) => a.seed - b.seed);
}

function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function delay(milliseconds: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
function positiveInteger(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`--${name} must be a positive integer`);
  return parsed;
}
