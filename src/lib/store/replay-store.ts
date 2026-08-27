import "server-only";

import fs from "node:fs";
import path from "node:path";
import demoReplay from "../../../fixtures/demo-replay.json";
import type { ReplayDocument } from "../replay-types";
import { parseReplayDocument } from "../replay-validation";

export type ReplayListing = {
  id: string;
  name: string;
  date: string;
  distanceMeters: number;
  elevationGainMeters: number | null;
  durationSeconds: number | null;
  description: string;
};

function loadCuratedReplays(): ReplayDocument[] {
  const directory = path.join(process.cwd(), "data", "replays");
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith(".json")).sort().map((name) => {
    return parseReplayDocument(JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")) as unknown, name.slice(0, -5));
  });
}

const replays = [parseReplayDocument(demoReplay, "demo-championship-loop"), ...loadCuratedReplays()];
const archivedReplayIds = new Set(["random-walk-san-francisco-marathon"]);

export function listReplays(): ReplayListing[] {
  return replays.filter(({ route }) => !archivedReplayIds.has(route.id)).map(({ route }) => ({
    id: route.id,
    name: route.name,
    date: route.createdAt,
    distanceMeters: route.distanceMeters,
    elevationGainMeters: route.elevationGainMeters,
    durationSeconds: route.durationSeconds,
    description: route.source === "simulation"
      ? "A seeded bridge-free random walk with no destination, no memory, and an increasingly busy revisit desk."
      : "A controlled demonstration of hills, judgment, and broadcast-grade walking."
  }));
}

export function getReplay(id: string): ReplayDocument | null {
  return replays.find((replay) => replay.route.id === id) ?? null;
}
