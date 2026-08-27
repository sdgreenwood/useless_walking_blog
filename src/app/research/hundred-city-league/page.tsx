import Link from "next/link";
import league from "../../../../data/research/hundred-city-league.json";

type CityResult = (typeof league.cities)[number];

export const metadata = {
  title: "The Hundred-City Random Walk League | Walking Ocho",
  description: "One thousand seeded random walks across the 100 largest U.S. cities. Nobody was allowed to remember an intersection."
};

export default function HundredCityLeaguePage() {
  const hardest = league.cities[0];
  const kindest = league.cities.at(-1)!;
  const censoredCities = league.cities.filter((city) => city.simulation.completionRate < 1).length;
  const totalSimulations = league.cities.reduce((total, city) => total + city.simulation.runs, 0);

  return (
    <main className="research-shell league-shell">
      <nav className="site-nav">
        <Link href="/" className="wordmark">Walking <span>Ocho</span></Link>
        <span className="season-label">Department of unnecessary research</span>
      </nav>

      <article className="research-article">
        <header className="research-hero league-hero">
          <p className="eyebrow">Preseason table · 100 cities · 1,000 seeded attempts</p>
          <h1>America&apos;s hardest city<br /><em>to walk badly.</em></h1>
          <p>We placed the same memoryless walker into the 100 largest U.S. cities. At every intersection it selected a legal segment uniformly at random. Then it continued until every reachable segment was covered—or race control stopped the experiment after 250 traversals per segment.</p>
          <div className="research-scoreboard league-scoreboard" aria-label="League summary">
            <Stat value="100" label="City graphs" />
            <Stat value={totalSimulations.toLocaleString()} label="Seeded attempts" />
            <Stat value={String(censoredCities)} label="Cities with a DNF" />
            <Stat value="0" label="HPI" />
          </div>
        </header>

        <section className="league-podium" aria-labelledby="commissioner-call">
          <div className="league-verdict">
            <p className="eyebrow">Commissioner&apos;s ruling</p>
            <h2 id="commissioner-call">Cape Coral has defeated the concept of eventually.</h2>
            <blockquote>{commentaryFor(hardest)}</blockquote>
            <dl>
              <div><dt>Completion rate</dt><dd>{percent(hardest.simulation.completionRate)}</dd></div>
              <div><dt>Median ordeal</dt><dd>{multiple(hardest)}</dd></div>
              <div><dt>Median coverage</dt><dd>{percent(hardest.simulation.typical.coverageShare)}</dd></div>
            </dl>
          </div>
          <div className="league-relief">
            <p className="eyebrow">Least impossible</p>
            <strong>#{kindest.difficultyRank} {kindest.city.name}</strong>
            <p>{kindest.city.name} required only {kindest.simulation.typical.coverageMultiple.toFixed(1)} complete copies of its network in the median run. The standards committee has described this as “basically direct.”</p>
          </div>
        </section>

        <section className="league-table-section" aria-labelledby="league-table-title">
          <div className="figure-heading">
            <div><p className="eyebrow">Official preseason standings</p><h2 id="league-table-title">One hundred cities. No useful decisions.</h2></div>
            <span>Ranked by completion rate, then normalized median distance</span>
          </div>
          <div className="league-table-wrap">
            <table className="league-table">
              <thead><tr><th>Rank</th><th>City</th><th>Median ordeal</th><th>Finished</th><th>Revisits</th><th>Unique network</th></tr></thead>
              <tbody>
                {league.cities.map((city) => (
                  <tr key={city.city.populationRank} className={city.simulation.completionRate < 1 ? "censored" : undefined}>
                    <td><strong>{String(city.difficultyRank).padStart(2, "0")}</strong></td>
                    <td><b>{city.city.name}</b><span>{city.city.state}</span></td>
                    <td><strong>{multiple(city)}</strong><span>{compactKilometers(city.simulation.typical.distanceKilometers)} walked</span></td>
                    <td><strong>{percent(city.simulation.completionRate)}</strong><span>{city.simulation.completionRate < 1 ? "censored seeds" : "10 of 10"}</span></td>
                    <td><strong>{percent(city.simulation.typical.revisitShare)}</strong><span>traversals</span></td>
                    <td><strong>{compactKilometers(city.graph.streetKilometers)}</strong><span>{city.graph.reachableSegments.toLocaleString()} segments</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="research-copy explanation-grid league-commentary">
          <div><p className="eyebrow">Selected calls</p><h2>The booth reviews the national failure.</h2></div>
          <div className="reason-list">
            {league.cities.slice(0, 5).map((city) => <p key={city.city.name}><strong>#{city.difficultyRank} {city.city.name}.</strong> {commentaryFor(city)}</p>)}
            <p><strong>#{kindest.difficultyRank} {kindest.city.name}.</strong> The easiest city still demanded {kindest.simulation.typical.coverageMultiple.toFixed(1)} network-lengths. Mercy remains outside the model.</p>
          </div>
        </section>

        <aside className="methods-note league-methods">
          <p className="eyebrow">Methods, limits, and the reason for the ≥ sign</p>
          <p>The roster is the 100 largest U.S. incorporated places in the Census Bureau&apos;s Vintage 2025 population estimates. Each city uses a fresh OpenStreetMap administrative-boundary snapshot, the largest connected component, and the original bridge-free Walking Ocho filter. Ten deterministic seeds start uniformly at junctions with at least three incident segments. Choices are uniform among every connected segment, including the one just used.</p>
          <p>A run is censored after 250 traversals for every reachable segment. A censored median is a measured lower bound, never a predicted finish. Fifty-five cities had at least one censored seed; three had no finishes. Population chooses the roster but does not affect rank. OSM completeness and boundary definitions vary, so this is a reproducible preseason experiment—not an official inventory of municipal streets.</p>
          <p>The fresh 100-city season uses a common 2026 snapshot contract. It does not reuse the unavailable raw graph behind the earlier San Francisco field report, whose published 4,923-segment preliminary graph remains a separate versioned result.</p>
          <div className="methods-actions">
            <Link href="/research/random-walk-san-francisco">Read the original San Francisco report →</Link>
            <Link href="/">Return to the replay desk →</Link>
            <a href={league.roster.sourceUrl}>Census roster source →</a>
          </div>
        </aside>
      </article>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function multiple(city: CityResult): string {
  const prefix = city.simulation.typical.completed ? "" : "≥";
  return `${prefix}${city.simulation.typical.coverageMultiple.toFixed(1)}×`;
}

function commentaryFor(city: CityResult): string {
  const remaining = Math.max(0, Math.round(city.graph.reachableSegments * (1 - city.simulation.typical.coverageShare)));
  if (city.simulation.completionRate === 0) return `Ten walkers entered ${city.city.name}. None finished before the limit. The median attempt covered ${percent(city.simulation.typical.coverageShare)} of the graph and was still missing roughly ${remaining.toLocaleString()} segments. Outstanding refusal to conclude.`;
  if (city.simulation.completionRate < 0.5) return `${city.city.name} finished only ${Math.round(city.simulation.completionRate * 10)} of ten attempts. Race control has classified the remaining walkers as long-term municipal fixtures.`;
  if (!city.simulation.typical.completed) return `${city.city.name} reached ${percent(city.simulation.typical.coverageShare)} median coverage and then spent the rest of the broadcast looking for approximately ${remaining.toLocaleString()} final bad decisions.`;
  return `${city.city.name} completed all ten attempts. The median walker repeated ${percent(city.simulation.typical.revisitShare)} of its traversals, which the booth is generously calling route familiarity.`;
}

function percent(value: number): string { return `${(value * 100).toFixed(value === 1 || value === 0 ? 0 : 1)}%`; }
function compactKilometers(value: number): string { return `${Math.round(value).toLocaleString()} km`; }
