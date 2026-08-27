import Link from "next/link";
import { listReplays } from "@/lib/store/replay-store";
import { formatClock, formatDistance } from "@/lib/replay-math";

export default function Home() {
  const replays = listReplays();

  return (
    <main className="landing-shell">
      <nav className="site-nav">
        <Link href="/" className="wordmark">Walking <span>Ocho</span></Link>
        <span className="season-label">Independent walking coverage</span>
      </nav>

      <section className="hero">
        <p className="eyebrow">The worldwide leader in unnecessary walking analysis</p>
        <h1>Relive your walk with commentary nobody requested.</h1>
        <p className="hero-copy">Route telemetry, tactical hill coverage, and a full broadcast booth—applied to the noble act of going outside for a bit.</p>
        <div className="hero-actions">
          <Link className="primary-action" href={`/replay/${replays[0].id}`}>Watch the demo</Link>
          <a className="secondary-action" href="#replays">View replay desk</a>
        </div>
      </section>

      <section className="promise-strip" aria-label="Product principles">
        <div><strong>Deterministic facts</strong><span>The route engine does the math.</span></div>
        <div><strong>One-time commentary</strong><span>No regeneration on page view.</span></div>
        <div><strong>Privacy reviewed</strong><span>Only curated routes are published.</span></div>
      </section>

      <section className="research-promo">
        <div>
          <p className="eyebrow">Department of unnecessary research</p>
          <h2>What if a walker tried to cover San Francisco by making the dumbest possible decision at every intersection?</h2>
        </div>
        <div>
          <strong>12,028 miles</strong>
          <span>Median simulated walk</span>
          <Link href="/research/random-walk-san-francisco">Read the field report →</Link>
        </div>
      </section>

      <section className="replay-desk" id="replays">
        <div className="section-heading">
          <div><p className="eyebrow">Replay desk</p><h2>Featured coverage</h2></div>
          <span>{replays.length} {replays.length === 1 ? "event" : "events"} on the schedule</span>
        </div>
        <div className="replay-cards">
          {replays.map((replay) => (
            <Link className="replay-card" href={`/replay/${replay.id}`} key={replay.id}>
              <div className="route-thumbnail" aria-hidden="true"><span /><i /></div>
              <div className="card-content">
                <p className="eyebrow">Condensed replay</p>
                <h3>{replay.name}</h3>
                <p>{replay.description}</p>
                <dl>
                  <div><dt>Distance</dt><dd>{formatDistance(replay.distanceMeters)}</dd></div>
                  <div><dt>Gain</dt><dd>{replay.elevationGainMeters === null ? "—" : `${Math.round(replay.elevationGainMeters)} m`}</dd></div>
                  <div><dt>Official time</dt><dd>{replay.durationSeconds === null ? "—" : formatClock(replay.durationSeconds)}</dd></div>
                </dl>
                <span className="watch-link">Open replay <b>→</b></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer><span>Walking Ocho</span><p>No walkers were drafted in the making of this broadcast.</p></footer>
    </main>
  );
}
