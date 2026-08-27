import { readFile, writeFile } from "node:fs/promises";
import { parseReplayDocument } from "../src/lib/replay-validation";
import type { Commentary } from "../src/lib/replay-types";

async function main() {
const args = Object.fromEntries(process.argv.slice(2).map((arg) => { const [key, ...rest] = arg.replace(/^--/, "").split("="); return [key, rest.join("=")]; }));
if (!args.input || !args.output) throw new Error("Usage: --input=... --output=...");
const replay = parseReplayDocument(JSON.parse(await readFile(args.input, "utf8")));
const next = structuredClone(replay);
next.route.id = "johto-league-san-francisco-exhibition";
next.route.name = "Johto League: More Map Than Progress";
const eventIds = next.route.events.map((event) => event.id);
const lines: Array<Omit<Commentary, "eventId" | "source">> = [
  { speaker: "play_by_play", text: "Tonight's interleague exhibition pairs one memoryless California walker with a Crystal correspondent who has spent the day losing an argument with Ice Path.", importance: 3 },
  { displayProgress: .12, speaker: "stats_desk", text: "California revisit desk: 47.6%. The Johto desk recognizes this as the same corridor wearing a different expression.", importance: 2 },
  { displayProgress: .23, speaker: "color", text: "Blackthorn can be visible and still not be a route. San Francisco can be mapped and still not be a plan.", importance: 2 },
  { displayProgress: .35, speaker: "field_reporter", text: "Two hundred seven distinct segments acquired. This is officially more map than progress.", importance: 2 },
  { displayProgress: .48, speaker: "play_by_play", text: "The frozen floor has become a California intersection. Different surface, identical refusal to learn anything.", importance: 2 },
  { displayProgress: .5, speaker: "stats_desk", text: "Halftime: neither side has acquired a badge, a destination, or a defensible reason to continue.", importance: 3 },
  { displayProgress: .64, speaker: "color", text: "Revisit rate: 56.9%. This is a route problem, not a party problem. The San Francisco entry has neither.", importance: 2 },
  { displayProgress: .77, speaker: "field_reporter", text: "HPI remains zero. Johto has ice; California had every bridge removed before the walker could attempt a water-type strategy.", importance: 2 },
  { displayProgress: .9, speaker: "play_by_play", text: "OH MY GOODNESS, THE EXIT IS PRACTICALLY VISIBLE—AND BOTH COMPETITORS ARE STILL WALKING PAST IT!!!!!", importance: 3 },
  { speaker: "stats_desk", text: "The marathon exhibition is complete. 99,854 city segments remain, and the commission awards the trophy for More Map Than Progress.", importance: 3 }
];
next.route.commentary = lines.map((line, index) => ({ ...line, eventId: eventIds[[0,1,2,3,4,5,6,8,9,11][index]], source: "deterministic" }));
parseReplayDocument(next);
await writeFile(args.output, `${JSON.stringify(next, null, 2)}\n`, { flag: "wx" });
console.log(`Wrote ${args.output}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
