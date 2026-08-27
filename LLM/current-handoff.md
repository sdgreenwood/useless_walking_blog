# Current handoff

## Current objective

Decide whether to turn the San Francisco random-walk research prototype into a published editorial lab.

## Current state

- The cohesive initial V1 is committed locally on `main`; the working tree should remain clean until the next authorized tranche.
- `fixtures/demo-walk.gpx` provides deterministic GPX input with timestamps and elevation.
- `fixtures/demo-replay.json` provides route geometry, samples, statistics, events, and hand-authored commentary.
- The fixture validates as JSON/XML and through the full replay schema.
- `importWalkingLabRoute(input)` projects WalkingLab schema v1 into a normalized, segmented route without copying HealthKit UUIDs, device/source metadata, update identities, export time, or absolute timestamps.
- GPX and WalkingLab import, route analysis, endpoint privacy trimming, deterministic fallback commentary, optional one-time OpenAI commentary, deep replay validation, private visual preview, guarded file publication, and public replay discovery are implemented.
- Landing page, stable `/replay/<id>` URLs, sharing, completed-route map, event markers, elevation profile, responsive controls, Highlights, and Instant Recap are implemented.
- Public replay/store code cannot call OpenAI; curated pages are statically generated.
- Final checks pass: strict TypeScript, clean ESLint, 31 tests, production build, HTTP 200/200/404 smoke checks, desktop/mobile browser acceptance, and private preview acceptance.
- The supplied private WalkingLab export completed the full pipeline in dry-run mode with default endpoint trimming; no file was written or private values printed.
- The fixture replay is live at `https://useless-walking-blog.vercel.app/replay/demo-championship-loop`; live mobile verification passed playback, modes, map rendering, and responsive overflow checks.
- The live CSS moves the current commentary card ahead of the map below 900 px and hides commentary history below 560 px.
- `multioak-stairs` and `oakhurst-stairs` are live from the two user-supplied WalkingLab exports with endpoint trimming and hand-authored halfway commentary; raw inputs and ignored candidates remain outside Git.
- The live commentary-density update gives each replay ten calls and adds validated editorial display timing without creating fictional route events or public model calls.
- A complete local deck.gl migration now owns route, completed progress, current position, start/finish, events, and active annotations through reusable layers. The old imperative MapLibre renderer is removed; MapLibre/OpenFreeMap remains only a replaceable basemap child.
- Migration checks pass: strict TypeScript, ESLint, 36 tests including a 10,000-point full-fidelity path, production build, desktop/mobile browser playback, and no deck.gl runtime errors.
- The deck.gl migration is live. Production verification confirms the new visualization host, removal of the legacy route container, 390 px playback without overflow, and correct Multioak event navigation.
- Current, Hex Ghost, and Relief visualization modes are live behind the map-stage toggle. Production verification confirms both new modes activate with zero runtime errors; they share replay progress and deterministic route data.
- The DEM-backed Relief correction is live: Mapzen terrain tiles from AWS Open Data provide the surface and all replay overlays share the elevated frame. Production verification passed on Multioak at desktop and 390 px with attribution, no overflow, and zero runtime errors. The owner explicitly approved disclosure of visible route-area tile coordinates to AWS.
- The root-cause spatial audit is live. It proves the coordinate/tile/decoder pipeline with five controls, adds `?spatial-debug=1`, removes the unexplained 3 m lift, and disables MapLibre terrain camera clamping so both canvases share a sea-level view frame. Recorded GPS elevation remains analysis evidence. Production verification passed the hidden proof mode and ordinary Relief view without terrain-camera or overzoom warnings.
- Eight additional historical TCX walks (17.21–34.90 miles) passed deterministic import with default 200 m endpoint trimming. After the owner supplied `I_REVIEWED_PRECISE_LOCATION`, their curated replay projections were added under `data/replays/`; raw TCX inputs and ignored mode-0600 candidates remain outside Git. Automated quality analysis found no unusable candidate, though seven retain reviewable GPS/elevation flags in the private import record.
- A separate, non-production San Francisco random-walk research prototype now exists in `scripts/simulate-random-walk.ts` with a blog-ready methods/results draft in `docs/RANDOM_WALK_SAN_FRANCISCO.md`. A 1,000-seed exploratory run on a public OSM snapshot produced a 19,634 km median edge-cover walk over a 434 km largest component. The result is preliminary until the pedestrian graph and water boundary are visually audited; it is intentionally not wired into replay pages.

## Fixture replay gate

Accepted locally on 2026-08-24:

1. render the route and current position;
2. play, pause, restart, and scrub;
3. change replay speed;
4. synchronize metrics, elevation position, and commentary;
5. navigate highlights;
6. work responsively without keys, a database, or network-dependent generation.

The fixture-first gate enabled analysis and commentary implementation without requiring a live paid call.

## Recommended next assignment

If the owner approves the research direction, freeze and visually audit the OSM graph, add small-graph simulator tests, and build the deck.gl “last stupid block” editorial animation. Do not merge it into historical replay business logic.

## External gates

- The current request explicitly authorizes publishing the two supplied routes to the website.
- No live OpenAI request has been made; it requires `OPENAI_API_KEY` and an intentional `--commentary=openai` import.
- Publishing any future real route requires creating a private candidate, visual location/commentary review, and the explicit publish confirmation.

## Git and external state

- GitHub `origin/main` contains verified V1 commit `e86c1c5cc0afbb3eb90dc6abf0d058ba0bed3c84` as of 2026-08-24.
- Vercel deployment is live and verified at `https://useless-walking-blog.vercel.app`.
- Commit `ec111f1` publishes the two curated stair replays and mobile commentary-first layout; both replay URLs and the three-card replay desk are live and verified.
- Commit `b9860c7` increases all three replays to ten commentary calls; the Vercel production replay reports `10/10` and no runtime errors.
- Commit `25f1931` makes deck.gl the primary visualization framework; the Vercel production replay is live and verified.
- Commit `be176cd` adds Hex Ghost and Relief presentation modes; both are live and verified on the Vercel production replay.
- Commit `eed2ec0` adds the DEM-backed Relief terrain surface and aligned elevated replay overlays; the production Multioak replay is live and verified.
- Commit `cd5b208` proves and corrects the spatial pipeline; the production Multioak proof and public Relief modes are live and verified.
- Commit `9a2fecb` publishes the eight owner-reviewed TCX replay projections; all eight production URLs returned HTTP 200 after Vercel deployment.
