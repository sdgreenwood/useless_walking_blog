import fs from "node:fs";
import path from "node:path";

type CrystalGrid = {
  width: number;
  height: number;
  cells: string[];
  labels: Array<{ text: string; x: number; y: number }>;
  source: {
    attribution: string;
    bounds: { south: number; west: number; north: number; east: number };
    h3: { cell: string; center: { lat: number; lon: number }; resolution: number };
  };
};

type CrystalAudit = {
  passed: boolean;
  errors: string[];
  notes: string[];
  cell_counts: Record<string, number>;
  houses: number;
  wild_sites: number;
  walkable_reach_percent: number;
};

const args = Object.fromEntries(process.argv.slice(2).map((value) => {
  const match = value.match(/^--([^=]+)=(.+)$/);
  if (!match) throw new Error(`Arguments must use --key=value: ${value}`);
  return [match[1], match[2]];
}));

const required = (name: string): string => {
  const value = args[name];
  if (!value) throw new Error(`Missing --${name}=value`);
  return value;
};

const grid = JSON.parse(fs.readFileSync(required("grid"), "utf8")) as CrystalGrid;
const audit = JSON.parse(fs.readFileSync(required("audit"), "utf8")) as CrystalAudit;
if (!audit.passed || audit.errors.length > 0) {
  throw new Error(`Refusing to package a failed Crystal grid: ${audit.errors.join("; ")}`);
}
if (grid.cells.length !== grid.width * grid.height) {
  throw new Error(`Crystal grid has ${grid.cells.length} cells; expected ${grid.width * grid.height}`);
}

const progress = Number(required("progress"));
if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
  throw new Error("--progress must be within 0...1");
}

const artifact = {
  schemaVersion: 1,
  id: required("id"),
  replayId: required("replay-id"),
  triggerProgress: progress,
  generator: {
    repository: "https://github.com/TheCulliganMan/goethite",
    commit: required("generator-commit")
  },
  h3: {
    cell: grid.source.h3.cell,
    resolution: grid.source.h3.resolution,
    center: grid.source.h3.center,
    bounds: grid.source.bounds
  },
  grid: {
    width: grid.width,
    height: grid.height,
    cells: grid.cells,
    labels: grid.labels
  },
  audit: {
    passed: audit.passed,
    walkableReachPercent: audit.walkable_reach_percent,
    houses: audit.houses,
    wildSites: audit.wild_sites,
    cellCounts: audit.cell_counts,
    notes: audit.notes
  },
  attribution: grid.source.attribution
};

const output = path.resolve(required("output"));
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(artifact, null, 2)}\n`, { flag: "wx" });
console.error(`Crystal cutaway written: ${output}`);
