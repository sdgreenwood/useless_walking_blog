"use client";

import { useEffect, useRef } from "react";
import californiaCutawayData from "../../data/research/crystal-cutaways/sf-california-random-marathon-west.json";
import johtoCutawayData from "../../data/research/crystal-cutaways/johto-league-sf-west.json";

type CrystalCutawayArtifact = {
  replayId: string;
  triggerProgress: number;
  generator: { repository: string; commit: string };
  h3: { cell: string; resolution: number };
  grid: {
    width: number;
    height: number;
    cells: string[];
    labels: Array<{ text: string; x: number; y: number }>;
  };
  audit: {
    passed: boolean;
    walkableReachPercent: number;
    houses: number;
    wildSites: number;
    cellCounts: Record<string, number>;
  };
  attribution: string;
};

const cutaways = [californiaCutawayData, johtoCutawayData] as CrystalCutawayArtifact[];

export function CrystalCutaway({ replayId, progress, onSeek }: { replayId: string; progress: number; onSeek: (progress: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cutaway = cutaways.find((candidate) => candidate.replayId === replayId);
  const acquired = cutaway ? progress >= cutaway.triggerProgress : false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cutaway) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const draw = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(240, Math.floor(canvas.clientWidth * ratio));
      const height = width;
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = false;
      context.fillStyle = "#030806";
      context.fillRect(0, 0, width, height);
      const cellWidth = width / cutaway.grid.width;
      const cellHeight = height / cutaway.grid.height;
      cutaway.grid.cells.forEach((cell, index) => {
        context.fillStyle = cellColor(cell);
        context.fillRect(
          (index % cutaway.grid.width) * cellWidth,
          Math.floor(index / cutaway.grid.width) * cellHeight,
          Math.ceil(cellWidth),
          Math.ceil(cellHeight)
        );
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [cutaway]);

  if (!cutaway) return null;

  return (
    <section className={`crystal-cutaway ${acquired ? "signal-acquired" : "signal-pending"}`} aria-label="Crystal coordinate map cutaway">
      <div className="crystal-cutaway-copy">
        <div>
          <p className="eyebrow">Johto correspondent · audited field feed</p>
          <h2>{acquired ? "The signal is acquired." : "A second map is standing by."}</h2>
          <p>
            At {Math.round(cutaway.triggerProgress * 100)}% progress, the real route enters H3 cell <code>{cutaway.h3.cell}</code>.
            Goethite translated that same public geography into a deterministic Crystal-style grid; this original black-and-mint rendering uses its audited cell data, not Pokémon artwork.
          </p>
        </div>
        <button onClick={() => onSeek(cutaway.triggerProgress)}>Go to the cutaway</button>
        <dl>
          <div><dt>Reachable</dt><dd>{cutaway.audit.walkableReachPercent.toFixed(0)}%</dd></div>
          <div><dt>Houses</dt><dd>{cutaway.audit.houses}</dd></div>
          <div><dt>Wild sites</dt><dd>{cutaway.audit.wildSites}</dd></div>
          <div><dt>Resolution</dt><dd>H3-{cutaway.h3.resolution}</dd></div>
        </dl>
        <p className="crystal-provenance">
          Audit passed · generator <a href={`${cutaway.generator.repository}/commit/${cutaway.generator.commit}`}>{cutaway.generator.commit.slice(0, 7)}</a> · {cutaway.attribution}
        </p>
        {replayId === "johto-league-san-francisco-exhibition" ? (
          <p className="crystal-provenance">Exhibition commentary informed by <a href="https://ryanculligan.com/crystal-agent-progress">Crystal LLM&apos;s public field notes</a>; all lines here are original Walking Ocho copy.</p>
        ) : null}
      </div>
      <figure className="crystal-grid-figure">
        <canvas ref={canvasRef} role="img" aria-label="Black and mint rendering of the audited Crystal grid at the replay cutaway location" />
        <figcaption>
          {cutaway.grid.labels.slice(0, 3).map((label) => label.text).join(" · ")}
        </figcaption>
      </figure>
    </section>
  );
}

function cellColor(cell: string): string {
  if (cell === "h3_void") return "#020504";
  if (cell.includes("road") || cell === "trail") return "#53f2ae";
  if (cell.includes("pokecenter")) return "#f3eee2";
  if (cell.includes("mart")) return "#78b7ff";
  if (cell.includes("water")) return "#1b6581";
  if (cell.includes("building")) return "#d3c79c";
  if (cell.includes("tree")) return "#0f5638";
  if (cell.includes("cliff") || cell.includes("ledge") || cell === "boulder") return "#8b7644";
  if (cell.includes("fence")) return "#8da38f";
  if (cell === "flowers") return "#f2c94c";
  if (cell === "park" || cell === "lawn" || cell === "grass") return "#173f2d";
  if (cell === "pitch") return "#296b49";
  return "#204434";
}
