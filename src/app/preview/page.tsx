import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { ReplayExperience } from "@/components/replay-experience";
import { parseReplayDocument } from "@/lib/replay-validation";

export default function PrivatePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const configured = process.env.WALKING_OCHO_PREVIEW_CANDIDATE;
  if (!configured) notFound();
  const privateRoot = path.resolve("private-imports");
  const candidatePath = path.resolve(configured);
  if (!candidatePath.startsWith(`${privateRoot}${path.sep}`)) notFound();
  const candidate = JSON.parse(fs.readFileSync(candidatePath, "utf8")) as { replay?: unknown };
  const replay = parseReplayDocument(candidate.replay);

  return (
    <>
      <div className="private-preview-banner">
        <strong>Private local preview</strong>
        <span>Inspect the complete route, both endpoints, metrics, and every commentary line. Nothing is published yet.</span>
      </div>
      <ReplayExperience replay={replay} />
    </>
  );
}
