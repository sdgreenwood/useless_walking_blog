# Randomly walking San Francisco until nothing is left

Status: research prototype; preliminary results, not yet a public page.

## Product decision

This belongs beside the replay desk as an occasional Walking Ocho research feature, not inside the historical-route pipeline. The replay desk covers a walk that happened. This feature asks a ridiculous but reproducible question about a walk that almost certainly should not happen.

The recommended deliverable is a self-contained editorial lab:

1. a frozen, attributed OpenStreetMap pedestrian graph;
2. a seeded simulation whose rules fit in one paragraph;
3. an animated deck.gl coverage map;
4. a short article about why the final unvisited segment becomes a civic obsession;
5. downloadable aggregate results, but not a dashboard.

## Exact question

Start at a uniformly random junction with at least three incident segments in the largest reachable land-focused pedestrian component. At every junction, choose uniformly among every connected segment—including the one just used. Stop only after every undirected segment in that component has been traversed at least once.

There is no route planning, memory, preference for novelty, or mercy.

“Coverage” means edge coverage, not visiting every named street, node, block face, or square meter. A segment is the chain of OSM way geometry between decision points; intermediate shape points do not create decisions.

## Frozen preliminary graph

The prototype queried OpenStreetMap through Overpass at `2026-08-27T01:28:35Z` for highway ways in San Francisco's administrative boundary. It excludes motorway/trunk families, explicit private/no-foot ways, ferries, and bridge ways at least 200 meters long. It then selects the largest connected component.

Preliminary graph:

- 2,938 reachable junctions;
- 4,922 reachable decision-to-decision segments;
- 434.14 km / 269.76 mi of unique segment length;
- 6,482 underlying OSM node-to-node edges.

The bridge-length rule is a conservative proxy, not a proof of land intersection. Before publication, freeze the graph as a versioned artifact and visually audit its boundary, long bridges, parks, disconnected sidewalk systems, and all apparent water crossings. The current numbers are suitable for deciding whether the idea is interesting; they are not yet a claim about a canonical total of San Francisco street mileage.

## Preliminary result: 1,000 seeded walks

Seed family: `20260826...`; walking time is distance divided by a constant 4.8 km/h and therefore excludes stops, sleep, traffic signals, injury, and grade effects.

| Outcome | Distance | Unique-mile multiple | Revisited traversals | Nominal 8-hour days |
| --- | ---: | ---: | ---: | ---: |
| Fast (10th percentile) | 14,024 km / 8,714 mi | 32.3× | 96.8% | 365 |
| Typical (median) | 19,634 km / 12,200 mi | 45.2× | 97.8% | 511 |
| Slow (90th percentile) | 29,350 km / 18,237 mi | 67.6× | 98.5% | 764 |
| Unusually slow (99th percentile) | 53,397 km / 33,179 mi | 123.0× | 99.2% | 1,391 |

These are simulation percentiles, not confidence bounds. They are conditional on this graph, filter, segmentation rule, random-number generator, and stopping definition.

## Why 270 miles becomes 12,200

Adding street mileage describes an impossible omniscient traversal in which every segment is used once. A memoryless random walker solves a different problem.

- Every return from a dead end repeats its only access segment.
- A park path or staircase attached through one entrance becomes a rare excursion; the walker can pass the entrance thousands of times without choosing it.
- Narrow connections between neighborhoods act as bottlenecks. The walker spends long periods thoroughly re-covering one side before randomly crossing to the other.
- The last few uncovered segments dominate the clock. At 99% coverage, almost every choice produces another revisit, so apparent progress nearly stops.
- Repeated grid streets are not a bug. At each four-way junction there is only a one-in-four chance of selecting any particular exit, and the walk forgets every previous failure.
- Hills do not change choices in this baseline because the walker is deliberately indifferent to grade. They do make the nominal elapsed-time conversion optimistic and the physical version substantially more absurd. A later sensitivity model can apply grade-adjusted pace without changing the route sequence.

The article's central line should be: **the mileage is not the project; finding the last stupid block is the project.**

## Visualization: “the last stupid block”

Use one dark, quiet map with deck.gl layers and a compressed clock:

- unseen segments: thin charcoal;
- first traversal: bright Walking Ocho mint that slowly cools;
- revisits: an amber pulse whose intensity counts repeated traversals;
- current segment: white broadcast tracer;
- remaining segments: a large fixed counter, becoming comically prominent below ten;
- coverage chart: a single line that rises quickly and then flattens into a long tail;
- bottleneck cutaways: short ledger annotations such as “crossed for the 1,842nd time; still missing one path in the Presidio.”

The animation should render aggregated traversal batches rather than every step at high speed. The deck.gl layer receives immutable segment geometry plus typed arrays for visit count and first-visit index; React receives only the current playback index and summary text.

Suggested article sequence:

1. `270 MILES OF STREET. 12,200 MILES OF WALKING.`
2. Ten seconds of rapid green coverage.
3. The map stalls at 99.4% while the distance counter keeps accelerating.
4. A ledger cutaway explains the last ten segments and how often their entrances were missed.
5. Three synchronized ghosts show the 10th, 50th, and 90th percentile walks diverging.
6. The final segment lights up with the restraint of a championship broadcast covering an event nobody requested.

## Reproduction

The simulator is `scripts/simulate-random-walk.ts`. It accepts an Overpass JSON snapshot and does not fetch data itself:

```bash
npm run simulate:random-walk -- \
  --osm=/path/to/frozen-sf-highways.json \
  --runs=1000 \
  --seed=20260826
```

The exploratory Overpass query was:

```overpass
[out:json][timeout:300];
area["name"="San Francisco"]["boundary"="administrative"]["admin_level"="8"]->.a;
way(area.a)["highway"];
out body;
>;
out skel qt;
```

Do not silently refresh the graph for a published article. Store the source timestamp, filter version, graph checksum, simulation seed family, and aggregate result file so the numbers remain reproducible as OSM changes.

## Before publication

1. Replace the bridge-length proxy with a geometric land/water audit or a reviewed allow/deny list.
2. Render the frozen graph and inspect missing connections, islands, private paths, park boundaries, and apparent crossings.
3. Add automated tests on small graphs for uniform choice, edge coverage, dead ends, parallel edges, and seeded repeatability.
4. Decide whether “street segment” includes sidewalks and park paths or only street centerlines; publish both as a sensitivity comparison if the distinction is editorially useful.
5. Run at least three filter variants and report how much the median changes.
6. Add elevation only as a second-stage elapsed-time model. Do not let grade influence the baseline random choices.
