import fs from "node:fs";
import path from "node:path";
import { importGpxRoute } from "../src/lib/importers/gpx";
import { importWalkingLabRoute } from "../src/lib/importers/walkinglab";
import { importTcxRoute } from "../src/lib/importers/tcx";
import { buildReplay } from "../src/lib/pipeline/build-replay";
import { generateCommentary } from "../src/lib/commentary/openai-adapter";
import type { CommentaryGenerationInput } from "../src/lib/commentary/types";

void main();

async function main(): Promise<void> {
const args = parseArgs(process.argv.slice(2));
const inputPath = required(args, "input");
const id = required(args, "id");
const name = required(args, "name");
const trimStartMeters = numeric(args["trim-start"] ?? "200", "trim-start");
const trimEndMeters = numeric(args["trim-end"] ?? "200", "trim-end");
const commentaryMode = args.commentary ?? "deterministic";
const dryRun = args["dry-run"] === "true";
if (commentaryMode !== "deterministic" && commentaryMode !== "openai") throw new Error("--commentary must be deterministic or openai");

const absoluteInput = path.resolve(inputPath);
const text = fs.readFileSync(absoluteInput, "utf8");
const lowerInput = absoluteInput.toLowerCase();
const normalized = lowerInput.endsWith(".gpx")
  ? importGpxRoute(text)
  : lowerInput.endsWith(".tcx")
    ? importTcxRoute(text)
    : importWalkingLabRoute(JSON.parse(text) as unknown);
const createdAt = new Date().toISOString();
const base = buildReplay(normalized, { id, name, createdAt, trimStartMeters, trimEndMeters });

let result = base;
if (commentaryMode === "openai") {
  const route = base.replay.route;
  const input: CommentaryGenerationInput = {
    routeId: route.id,
    facts: {
      name: route.name,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      elevationGainMeters: route.elevationGainMeters,
      averagePaceSecondsPerKilometer: route.stats.averagePaceSecondsPerKilometer,
      highestElevationMeters: route.stats.highestElevationMeters,
      lowestElevationMeters: route.stats.lowestElevationMeters
    },
    events: route.events.map(({ id: eventId, type, routeProgress, distanceMeters, elapsedSeconds, metrics, importance }) => ({
      id: eventId,
      type,
      routeProgress,
      distanceMeters,
      elapsedSeconds,
      metrics,
      importance
    }))
  };
  const generated = await generateCommentary(input);
  result = buildReplay(normalized, { id, name, createdAt, trimStartMeters, trimEndMeters, commentary: generated.package });
}

const outputDirectory = path.resolve("private-imports");
fs.mkdirSync(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, `${id}.candidate.json`);
const candidate = {
  replay: result.replay,
  privacy: result.privacy,
  quality: result.quality,
  review: {
    status: "REQUIRES_HUMAN_LOCATION_REVIEW",
    commentaryMode,
    checklist: [
      "Inspect the first and last published points for sensitive locations.",
      "Inspect the entire route for home, workplace, and repeated-routine exposure.",
      "Read every commentary line and confirm every factual claim.",
      "Publish only with scripts/publish-route.ts and the explicit confirmation phrase."
    ]
  }
};
if (!dryRun) {
  fs.writeFileSync(outputPath, `${JSON.stringify(candidate, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(`Private candidate created: ${outputPath}`);
} else {
  console.log("Dry run complete; no candidate file written.");
}
console.log(`Published samples: ${result.privacy.publishedSampleCount}/${result.privacy.originalSampleCount}; quality flags: ${result.quality.length}`);
if (result.quality.length) console.log(`Quality summary: ${result.quality.map((flag) => `${flag.code}:${flag.count}`).join(", ")}`);
}

function parseArgs(values: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--") continue;
    if (!value.startsWith("--")) throw new Error(`Unexpected argument: ${value}`);
    const [key, inline] = value.slice(2).split("=", 2);
    const next = inline ?? values[++index];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
    parsed[key] = next;
  }
  return parsed;
}
function required(values: Record<string, string>, key: string): string {
  if (!values[key]) throw new Error(`Missing required --${key}`);
  return values[key];
}
function numeric(value: string, key: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`--${key} must be a non-negative number`);
  return parsed;
}
