import { readFile, writeFile } from "node:fs/promises";
import { parseReplayDocument } from "../src/lib/replay-validation";
import { applyDemElevation } from "../src/lib/elevation/replay-elevation";
import { coordinateToTilePixel, decodeTerrariumPng, sampleTerrariumTile, TERRARIUM_ATTRIBUTION, TERRARIUM_DATASET, TERRARIUM_URL_TEMPLATE } from "../src/lib/elevation/terrarium";

async function main() {
const args = Object.fromEntries(process.argv.slice(2).map((arg) => { const [key, ...rest] = arg.replace(/^--/, "").split("="); return [key, rest.join("=")]; }));
if (!args.input || !args.output) throw new Error("Usage: --input=... --output=... [--zoom=14] [--sampled-at=ISO]");
const zoom = Number(args.zoom ?? 14);
if (!Number.isInteger(zoom) || zoom < 0 || zoom > 15) throw new Error("zoom must be an integer from 0 through 15");
const replay = parseReplayDocument(JSON.parse(await readFile(args.input, "utf8")));
if (replay.route.samples.some((sample) => sample.elevationMeters !== null)) throw new Error("Input already contains elevation; refusing an unexplained replacement.");

const positions = replay.route.samples.map((sample) => coordinateToTilePixel(sample.coordinates, zoom));
const keys = [...new Set(positions.map((point) => `${point.tileX}/${point.tileY}`))];
const tiles = new Map<string, ReturnType<typeof decodeTerrariumPng>>();
for (const key of keys) {
  const [x, y] = key.split("/").map(Number);
  const url = TERRARIUM_URL_TEMPLATE.replace("{z}", String(zoom)).replace("{x}", String(x)).replace("{y}", String(y));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`DEM request failed (${response.status}) for ${zoom}/${x}/${y}`);
  tiles.set(key, decodeTerrariumPng(Buffer.from(await response.arrayBuffer())));
}
const elevations = positions.map((point) => sampleTerrariumTile(tiles.get(`${point.tileX}/${point.tileY}`)!, point.pixelX, point.pixelY));
const enriched = applyDemElevation(replay, elevations, {
  dataset: TERRARIUM_DATASET,
  attribution: TERRARIUM_ATTRIBUTION,
  sampledAt: args["sampled-at"] ?? new Date().toISOString(),
  zoom
});
parseReplayDocument(enriched);
await writeFile(args.output, `${JSON.stringify(enriched, null, 2)}\n`, { flag: "wx" });
console.log(`Wrote ${args.output}: ${elevations.length} samples, ${keys.length} XYZ tile(s), ${enriched.route.elevationGainMeters?.toFixed(1)} m gain.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
