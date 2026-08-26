"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ElevationProfile } from "./elevation-profile";
import { clampProgress, formatClock, formatDistance, sampleAtProgress, visibleCommentary } from "@/lib/replay-math";
import type { ReplayDocument } from "@/lib/replay-types";
import type { VisualizationMode } from "@/lib/visualization/route-layers";

const RouteVisualization = dynamic(() => import("./route-visualization").then((module) => module.RouteVisualization), { ssr: false });
const REPLAY_SECONDS = 90;
type ReplayMode = "Condensed" | "Highlights" | "Instant Recap";
const speakerNames = { play_by_play: "Play-by-play", color: "Color", stats_desk: "Stats desk", field_reporter: "Field report" };

export function ReplayExperience({ replay }: { replay: ReplayDocument }) {
  const route = replay.route;
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<ReplayMode>("Condensed");
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>("current");
  const previousFrame = useRef<number | null>(null);
  const current = useMemo(() => sampleAtProgress(route.samples, progress), [route.samples, progress]);
  const commentary = useMemo(() => {
    const visible = visibleCommentary(route, progress);
    return mode === "Highlights" ? visible.filter((line) => line.importance >= 2) : visible;
  }, [mode, route, progress]);
  const currentLine = commentary.at(-1);
  const activeEvent = useMemo(
    () => [...route.events].reverse().find((event) => event.routeProgress <= progress),
    [progress, route.events]
  );
  const highlights = useMemo(() => route.events.filter((event) => event.importance >= 2), [route.events]);

  useEffect(() => {
    if (!playing) {
      previousFrame.current = null;
      return;
    }
    let frame: number;
    const tick = (now: number) => {
      const prior = previousFrame.current ?? now;
      previousFrame.current = now;
      setProgress((value) => {
        const modeDuration = mode === "Highlights" ? REPLAY_SECONDS / 2 : REPLAY_SECONDS;
        const next = clampProgress(value + ((now - prior) / 1000 / modeDuration) * speed);
        if (next === 1) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mode, playing, speed]);

  const selectMode = (nextMode: ReplayMode) => {
    setPlaying(false);
    setMode(nextMode);
    setProgress(nextMode === "Instant Recap" ? 1 : 0);
  };

  const jump = (direction: -1 | 1) => {
    const candidates = direction === 1
      ? highlights.filter((event) => event.routeProgress > progress + 0.005)
      : [...highlights].reverse().filter((event) => event.routeProgress < progress - 0.005);
    setProgress(candidates[0]?.routeProgress ?? (direction === 1 ? 1 : 0));
  };

  return (
    <main className="shell">
      <header className="broadcast-header">
        <div>
          <p className="eyebrow">Walking Ocho · Replay center</p>
          <h1>{route.name}</h1>
        </div>
        <div className="live-pill"><span /> {route.source === "fixture" ? "Demo fixture" : "Curated replay"}</div>
      </header>

      <nav className="mode-switcher" aria-label="Replay mode">
        {(["Condensed", "Highlights", "Instant Recap"] as const).map((item) => (
          <button className={mode === item ? "active" : ""} key={item} onClick={() => selectMode(item)}>{item}</button>
        ))}
      </nav>

      <section className="replay-grid">
        <div className="map-stage">
          <div className="visualization-switcher" role="group" aria-label="Map visualization">
            {([
              ["current", "Current"],
              ["hex-ghost", "Hex Ghost"],
              ["relief", "Relief"]
            ] as const).map(([value, label]) => (
              <button
                className={visualizationMode === value ? "active" : ""}
                key={value}
                onClick={() => setVisualizationMode(value)}
                aria-pressed={visualizationMode === value}
              >{label}</button>
            ))}
          </div>
          <RouteVisualization
            route={route}
            current={current.coordinates}
            currentElevationMeters={current.elevationMeters}
            progress={progress}
            activeEventId={activeEvent?.id}
            mode={visualizationMode}
          />
          <div className="scorebug">
            <span>{Math.round(progress * 100)}%</span>
            <strong>{formatDistance(current.distanceMeters)}</strong>
            <small>{current.elapsedSeconds === null ? "time unavailable" : `${formatClock(current.elapsedSeconds)} elapsed`}</small>
          </div>
        </div>

        <aside className="commentary-panel" aria-live="polite">
          <div className="panel-heading">
            <div><p className="eyebrow">Broadcast booth</p><h2>Commentary</h2></div>
            <span>{commentary.length}/{route.commentary.length}</span>
          </div>
          {mode === "Instant Recap" ? (
            <article className="current-call recap-call">
              <p>Instant recap</p>
              <blockquote>{instantRecap(route.distanceMeters, route.elevationGainMeters, route.events.filter((event) => event.type.includes("climb")).length)}</blockquote>
              <span>{route.commentary.at(-1)?.text}</span>
            </article>
          ) : currentLine ? (
            <article className="current-call">
              <p>{speakerNames[currentLine.speaker]}</p>
              <blockquote>{currentLine.text}</blockquote>
            </article>
          ) : (
            <article className="current-call waiting"><p>Pregame</p><blockquote>The officials are reviewing the concept of walking.</blockquote></article>
          )}
          <div className="commentary-history">
            {[...commentary].reverse().slice(1, 4).map((line) => (
              <article key={line.eventId}><p>{speakerNames[line.speaker]}</p><span>{line.text}</span></article>
            ))}
          </div>
        </aside>

        <section className="analysis-panel">
          <div className="metric-row">
            <Metric label="Elevation" value={current.elevationMeters === null ? "—" : `${Math.round(current.elevationMeters)} m`} />
            <Metric label="Grade" value={current.gradePercent === null ? "—" : `${current.gradePercent.toFixed(1)}%`} />
            <Metric label="Total gain" value={route.elevationGainMeters === null ? "—" : `${Math.round(route.elevationGainMeters)} m`} />
            <Metric label="Remaining" value={formatDistance(route.distanceMeters - current.distanceMeters)} />
          </div>
          <div className="profile-heading"><span>Elevation profile</span><small>{route.stats.lowestElevationMeters === null || route.stats.highestElevationMeters === null ? "No elevation evidence" : `${route.stats.lowestElevationMeters}–${route.stats.highestElevationMeters} m`}</small></div>
          <ElevationProfile samples={route.samples} progress={progress} onSeek={setProgress} />
        </section>

        <section className="controls" aria-label="Playback controls">
          <button aria-label="Previous highlight" onClick={() => jump(-1)}>↶</button>
          <button disabled={mode === "Instant Recap"} className="play" aria-label={playing ? "Pause replay" : "Play replay"} onClick={() => { if (progress === 1) setProgress(0); setPlaying((value) => !value); }}>{playing ? "Pause" : "Play"}</button>
          <button aria-label="Next highlight" onClick={() => jump(1)}>↷</button>
          <input aria-label="Replay progress" type="range" min="0" max="1" step="0.001" value={progress} onChange={(event) => setProgress(Number(event.target.value))} />
          <label>Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{[0.5, 1, 2, 4].map((value) => <option key={value} value={value}>{value}×</option>)}</select></label>
          <button aria-label="Restart replay" onClick={() => { setPlaying(false); setProgress(0); }}>Restart</button>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function instantRecap(distanceMeters: number, elevationGainMeters: number | null, climbCount: number): string {
  const gain = elevationGainMeters === null ? "elevation data unavailable" : `${Math.round(elevationGainMeters)} meters gained`;
  const hills = climbCount === 0 ? "no major tactical hills detected" : `${climbCount} major tactical hill development${climbCount === 1 ? "" : "s"}`;
  return `${formatDistance(distanceMeters)}, ${gain}, and ${hills}.`;
}
