# Hundred-City Random Walk League

Status: production preseason, generated 2026-08-27.

## Product

The league repeats one experiment across the 100 largest U.S. incorporated places: start a memoryless walker at a random eligible junction, choose uniformly among connected legal segments, and attempt to traverse every segment in the largest reachable component.

This is a research/editorial product. It has no upgrades, player state, strategic policies, or relationship to the separate Dumb Gains game concept.

## Frozen roster

Membership follows the U.S. Census Bureau Vintage 2025 ranking of incorporated places by July 1, 2025 population. Population selects the 100 cities but never affects difficulty rank. The roster is frozen in `src/lib/research/hundred-city-roster.ts`.

## Graph contract

Each city resolves to an OpenStreetMap relation boundary. The batch stores that relation ID and display name with its result. Within the boundary it accepts public highway ways except:

- motorway/trunk families;
- proposed, abandoned, construction, raceway, and elevator ways;
- explicit private/no-access or private/no-foot ways;
- every bridge-tagged way.

Shape points are collapsed into decision-to-decision segments. Only the largest connected component is ranked. This retains the existing San Francisco prototype's conservative bridge-free/HPI-zero rule for cross-city consistency; it is not a canonical inventory of municipal streets.

## Simulation contract

- 10 deterministic seeds per city;
- start uniformly among graph nodes with at least three incident segments;
- choose uniformly among every incident segment, including the segment just used;
- no memory, route planning, novelty preference, grade preference, or model call;
- target: every undirected segment traversed at least once;
- preseason censoring: 250 traversals per reachable segment.

Censoring is necessary because random cover time has an extreme tail on large and bottlenecked graphs. A censored run records its actual traversal distance and achieved coverage but never invents a finish. The page prefixes a censored median multiple with `≥`.

Difficulty ranks by:

1. ascending completion rate, so fewer finishes is harder;
2. descending median walked distance divided by unique network length.

This is a preseason ranking based on ten seeds, not a stable estimate of fine differences between adjacent cities.

## Results snapshot

- 100 cities;
- 1,000 deterministic attempts;
- 55 cities with at least one censored run;
- 3 cities with no run finishing before the limit;
- hardest preseason result: Cape Coral, Florida;
- least difficult preseason result: New Orleans, Louisiana;
- HPI: zero by construction.

The humor is generated from stored result fields. Commentary distinguishes completed medians from censored lower bounds and does not invent geography or traversal facts.

## Reproduction

Run the resumable offline batch:

```bash
npm run simulate:city-league -- \
  --runs=10 \
  --traversal-cap=250 \
  --from=1 \
  --to=100
```

Per-city checkpoints live in the ignored `private-imports/hundred-city-league/` directory. The script skips completed checkpoints, retries transient Overpass failures across mirrors, and writes `data/research/hundred-city-league.json` only when exactly 100 city artifacts exist.

Refreshing a published season requires a deliberate new season/version. Do not silently mix snapshots or run contracts.

## Relationship to the original San Francisco report

The league's explicit city/state Nominatim lookup correctly resolves relation `111968`, San Francisco, California. A later coordinate audit proved that the earlier standalone name-only Overpass query selected San Francisco, Córdoba, Argentina. Its 4,923-segment graph and replay are therefore preserved only as a clearly labeled historical archive and are not California evidence.

The corrected California article reads the league's recorded graph and ten-seed preseason distribution. A newly versioned 42.275 km replay excerpt uses the correct relation and seed `20440001`; it does not rewrite the old artifact.
