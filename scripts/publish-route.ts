import fs from "node:fs";
import path from "node:path";
import type { ReplayDocument } from "../src/lib/replay-types";
import { parseReplayDocument } from "../src/lib/replay-validation";

const args = Object.fromEntries(process.argv.slice(2).map((value) => {
  const match = value.match(/^--([^=]+)=(.+)$/);
  if (!match) throw new Error(`Arguments must use --key=value: ${value}`);
  return [match[1], match[2]];
}));
if (args.confirm !== "I_REVIEWED_PRECISE_LOCATION") {
  throw new Error("Publishing requires --confirm=I_REVIEWED_PRECISE_LOCATION after visual and commentary review.");
}
if (!args.candidate) throw new Error("Missing --candidate=private-imports/<id>.candidate.json");

const privateRoot = path.resolve("private-imports");
const candidatePath = path.resolve(args.candidate);
if (!candidatePath.startsWith(`${privateRoot}${path.sep}`) || !candidatePath.endsWith(".candidate.json")) {
  throw new Error("Candidate must be a .candidate.json file inside private-imports.");
}
const candidate = JSON.parse(fs.readFileSync(candidatePath, "utf8")) as { replay?: ReplayDocument; review?: { status?: string } };
if (candidate.review?.status !== "REQUIRES_HUMAN_LOCATION_REVIEW" || candidate.replay?.schemaVersion !== 1 || !candidate.replay.route?.id) {
  throw new Error("Candidate does not match the guarded replay format.");
}
const replay = parseReplayDocument(candidate.replay);
const id = replay.route.id;
const destination = path.resolve("data", "replays", `${id}.json`);
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, `${JSON.stringify(replay, null, 2)}\n`, { flag: "wx" });
console.log(`Curated replay published locally: ${destination}`);
console.log("Run the full checks and inspect /replay/" + id + " before committing.");
