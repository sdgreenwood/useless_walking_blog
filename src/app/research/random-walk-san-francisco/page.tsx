import Link from "next/link";
import leagueData from "../../../../data/research/hundred-city-league.json";

const sanFrancisco = leagueData.cities.find((entry) => entry.city.name === "San Francisco" && entry.city.state === "California");
if (!sanFrancisco) throw new Error("Hundred-City League artifact is missing San Francisco, California");

const outcomeSource = [
  ["Fast · P10", sanFrancisco.simulation.fast],
  ["Typical · Median", sanFrancisco.simulation.typical],
  ["Slow · P90", sanFrancisco.simulation.slow],
  ["Unusually slow · P99", sanFrancisco.simulation.unusuallySlow]
] as const;
const outcomes = outcomeSource.map(([label, result]) => ({
  label,
  km: result.distanceKilometers,
  miles: result.distanceKilometers * 0.621371,
  multiple: result.coverageMultiple,
  revisit: result.revisitShare,
  days: result.nominalEightHourWalkingDays
}));
const typical = sanFrancisco.simulation.typical;
const network = sanFrancisco.graph;

export const metadata = {
  title: "Randomly Walking San Francisco, California | Walking Ocho",
  description: "A corrected seeded simulation of a walker covering San Francisco, California with no plan, no memory, and no permission to use bridges."
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
          <p className="eyebrow">Corrected field report 001 · San Francisco, California</p>
          <h1>{miles(network.streetKilometers)} miles of network.<br /><em>{miles(typical.distanceKilometers)} miles of walking.</em></h1>
          <p>We released a simulated pedestrian at a random intersection and required a uniform random choice at every junction until every reachable segment had been walked. No memory. No strategy. No mercy.</p>
          <p className="research-correction"><strong>Geography correction:</strong> the original prototype&apos;s ambiguous OSM name query selected San Francisco, Córdoba, Argentina. This report and its new replay use verified California relation 111968. The old replay remains available only as a labeled archive.</p>
          <div className="research-scoreboard" aria-label="Typical simulation result">
            <Stat value={`${typical.coverageMultiple.toFixed(1)}×`} label="Unique mileage" />
            <Stat value={percent(typical.revisitShare)} label="Revisited traversals" />
            <Stat value={Math.round(typical.nominalEightHourWalkingDays).toLocaleString()} label="Eight-hour days" />
            <Stat value="0" label="HPI" />
          </div>
        </header>

        <section className="coverage-figure" aria-labelledby="coverage-title">
          <div className="figure-heading">
            <div><p className="eyebrow">The median preseason result</p><h2 id="coverage-title">One useful traversal. One hundred sixteen more, for character.</h2></div>
            <span>{Math.round(network.streetKilometers).toLocaleString()} km unique / {Math.round(typical.distanceKilometers).toLocaleString()} km walked</span>
          </div>
          <div className="lap-stack" aria-label="Representative traces from the median distance multiple">
            {Array.from({ length: 45 }, (_, index) => <i className={index === 0 ? "unique" : "revisit"} key={index} />)}
          </div>
          <div className="figure-legend"><span><i className="unique" /> First useful coverage</span><span><i className="revisit" /> A representative slice of returning somewhere already covered</span></div>
          <p className="hpi-callout"><strong>HPI: 0</strong> Hydro-Pedestrian Incidents were eliminated by removing every OSM way tagged as a bridge. The commissioner has denied the walker maritime powers.</p>
        </section>

        <section className="research-copy two-column-copy">
          <div><p className="eyebrow">The rule</p><h2>At every intersection, roll the city-sized die.</h2></div>
          <div>
            <p>The start is a uniformly random reachable junction with at least three incident segments. Every connected walkable segment has equal odds, including the segment just used. Coverage means traversing every undirected segment in the largest connected bridge-free component at least once.</p>
            <p>The verified California graph contains {network.reachableJunctions.toLocaleString()} junctions, {network.reachableSegments.toLocaleString()} decision-to-decision segments, and {network.streetKilometers.toLocaleString(undefined, { maximumFractionDigits: 1 })} kilometers of unique segment length. Its OSM boundary is explicitly recorded as San Francisco, California, United States.</p>
          </div>
        </section>

        <section className="outcome-section">
          <div className="figure-heading"><div><p className="eyebrow">10-seed league preseason</p><h2>There is no good outcome. Only less slow.</h2></div><span>Deterministic seeds 20440000…</span></div>
          <div className="outcome-bars">
            {outcomes.map((outcome) => (
              <article key={outcome.label}>
                <div><strong>{outcome.label}</strong><span>{Math.round(outcome.km).toLocaleString()} km · {Math.round(outcome.miles).toLocaleString()} mi</span></div>
                <div className="outcome-track"><i style={{ width: `${(outcome.km / outcomes.at(-1)!.km) * 100}%` }} /></div>
                <dl><div><dt>Street multiple</dt><dd>{outcome.multiple.toFixed(1)}×</dd></div><div><dt>Revisits</dt><dd>{percent(outcome.revisit)}</dd></div><div><dt>8-hour days</dt><dd>{Math.round(outcome.days).toLocaleString()}</dd></div></dl>
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
          <p>Public OSM highway ways inside verified relation 111968 were filtered to remove motorway/trunk families, explicit private or no-foot access, ferries, and all bridge-tagged ways. Shape points were collapsed between decision nodes. Results are deterministic for the published seeds and conditional on this graph definition—not a canonical measurement of every sidewalk in San Francisco.</p>
          <div className="methods-actions">
            <Link href="/replay/random-walk-san-francisco-california-marathon">Watch the corrected California marathon →</Link>
            <Link href="/research/hundred-city-league">See the Hundred-City League →</Link>
            <Link href="/">Return to the replay desk →</Link>
          </div>
        </aside>
      </article>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function miles(kilometers: number): string {
  return Math.round(kilometers * 0.621371).toLocaleString();
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
