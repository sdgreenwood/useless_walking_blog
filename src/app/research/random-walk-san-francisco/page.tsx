import Link from "next/link";

const outcomes = [
  { label: "Fast · P10", km: 13787, miles: 8566, multiple: 31.8, revisit: "96.8%", days: 359 },
  { label: "Typical · Median", km: 19357, miles: 12028, multiple: 44.6, revisit: "97.7%", days: 504 },
  { label: "Slow · P90", km: 30531, miles: 18971, multiple: 70.3, revisit: "98.6%", days: 795 },
  { label: "Unusually slow · P99", km: 48433, miles: 30095, multiple: 111.6, revisit: "99.1%", days: 1261 }
];

export const metadata = {
  title: "Randomly Walking San Francisco | Walking Ocho",
  description: "One thousand simulations of a walker with no plan, no memory, and no permission to use bridges."
};

export default function RandomWalkSanFrancisco() {
  return (
    <main className="research-shell">
      <nav className="site-nav">
        <Link href="/" className="wordmark">Walking <span>Ocho</span></Link>
        <span className="season-label">Department of unnecessary research</span>
      </nav>

      <article className="research-article">
        <header className="research-hero">
          <p className="eyebrow">Field report 001 · San Francisco</p>
          <h1>270 miles of street.<br /><em>12,028 miles of walking.</em></h1>
          <p>We released a simulated pedestrian at a random intersection and required a uniform random choice at every junction until every reachable segment had been walked. No memory. No strategy. No mercy.</p>
          <div className="research-scoreboard" aria-label="Typical simulation result">
            <Stat value="44.6×" label="Unique mileage" />
            <Stat value="97.7%" label="Revisited traversals" />
            <Stat value="504" label="Eight-hour days" />
            <Stat value="0" label="HPI" />
          </div>
        </header>

        <section className="coverage-figure" aria-labelledby="coverage-title">
          <div className="figure-heading">
            <div><p className="eyebrow">The median result</p><h2 id="coverage-title">One useful traversal. Forty-three more, for character.</h2></div>
            <span>434 km unique / 19,357 km walked</span>
          </div>
          <div className="lap-stack" aria-label="Forty-five horizontal traces representing the median distance multiple">
            {Array.from({ length: 45 }, (_, index) => <i className={index === 0 ? "unique" : "revisit"} key={index} />)}
          </div>
          <div className="figure-legend"><span><i className="unique" /> First useful coverage</span><span><i className="revisit" /> Returning to somewhere already covered</span></div>
          <p className="hpi-callout"><strong>HPI: 0</strong> Hydroplaning Incidents were eliminated by removing every OSM way tagged as a bridge. The commissioner has denied the walker maritime powers.</p>
        </section>

        <section className="research-copy two-column-copy">
          <div><p className="eyebrow">The rule</p><h2>At every intersection, roll the city-sized die.</h2></div>
          <div>
            <p>The start is a random reachable junction. Every connected walkable segment has equal odds, including the segment just used. Coverage means traversing every undirected segment in the largest connected bridge-free component at least once.</p>
            <p>The graph contains 2,940 junctions, 4,923 decision-to-decision segments, and 434.05 kilometers of unique segment length. The source was an OpenStreetMap snapshot dated August 27, 2026.</p>
          </div>
        </section>

        <section className="outcome-section">
          <div className="figure-heading"><div><p className="eyebrow">1,000 seeded simulations</p><h2>There is no good outcome. Only less slow.</h2></div><span>Seed family 20260826…</span></div>
          <div className="outcome-bars">
            {outcomes.map((outcome) => (
              <article key={outcome.label}>
                <div><strong>{outcome.label}</strong><span>{outcome.km.toLocaleString()} km · {outcome.miles.toLocaleString()} mi</span></div>
                <div className="outcome-track"><i style={{ width: `${(outcome.km / outcomes.at(-1)!.km) * 100}%` }} /></div>
                <dl><div><dt>Street multiple</dt><dd>{outcome.multiple}×</dd></div><div><dt>Revisits</dt><dd>{outcome.revisit}</dd></div><div><dt>8-hour days</dt><dd>{outcome.days.toLocaleString()}</dd></div></dl>
              </article>
            ))}
          </div>
        </section>

        <section className="research-copy explanation-grid">
          <div><p className="eyebrow">Why it explodes</p><h2>The last stupid block is the entire project.</h2></div>
          <div className="reason-list">
            <p><strong>Cul-de-sacs charge twice.</strong> Entering one guarantees a return over the same access segment.</p>
            <p><strong>Parks become rare excursions.</strong> The walker can pass an entrance thousands of times without selecting it.</p>
            <p><strong>Bottlenecks imprison probability.</strong> Narrow connections let one neighborhood get re-covered while another waits.</p>
            <p><strong>The final segments own the clock.</strong> Near 100% coverage, almost every choice is another revisit.</p>
            <p><strong>Hills are currently ignored.</strong> They do not affect the random choice, so the constant-speed day estimate is offensively optimistic.</p>
          </div>
        </section>

        <aside className="methods-note">
          <p className="eyebrow">Methods, because apparently this is research</p>
          <p>Public OSM highway ways inside San Francisco’s administrative boundary were filtered to remove motorway/trunk families, explicit private or no-foot access, ferries, and all bridge-tagged ways. Shape points were collapsed between decision nodes. Results are deterministic for the published seeds and conditional on this graph definition—not a canonical measurement of every sidewalk in San Francisco.</p>
          <Link href="/">Return to the replay desk →</Link>
        </aside>
      </article>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}
