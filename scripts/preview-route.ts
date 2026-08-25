import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

const argument = process.argv.slice(2).find((value) => value.startsWith("--candidate="));
if (!argument) throw new Error("Use --candidate=private-imports/<id>.candidate.json");
const privateRoot = path.resolve("private-imports");
const candidate = path.resolve(argument.slice("--candidate=".length));
if (!candidate.startsWith(`${privateRoot}${path.sep}`) || !candidate.endsWith(".candidate.json") || !fs.existsSync(candidate)) {
  throw new Error("Candidate must be an existing .candidate.json file inside private-imports.");
}

console.log("Private preview: http://127.0.0.1:3000/preview");
console.log("This route is served only to your local browser. Press Ctrl-C when review is complete.");
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-H", "127.0.0.1", "-p", "3000"], {
  cwd: process.cwd(),
  env: { ...process.env, WALKING_OCHO_PREVIEW_CANDIDATE: candidate, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "inherit"
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
