# Current handoff

## Current objective

Maintain the replay desk, bridge-free research report, and seeded random-walk marathon example; await the next owner-selected story or route.

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
- The February 2018 replay is editorially identified as `The Minus-Eight Neighborhood Loop Classic`. Its ten owner-informed calls are scheduled against verified recurring loop returns and relative elapsed time; the route geometry supports roughly 22 neighborhood cycles over eight hours. The temperature and family anecdote remain explicitly owner-supplied context, not computed route facts.
- The original San Francisco prototype is confirmed mis-geocoded: its name-only OSM query selected San Francisco, Córdoba, Argentina. Its stable replay is labeled as an archive and excluded from discovery. The research page now uses verified California relation `111968` and the static Hundred-City League graph/distribution rather than presenting the Córdoba result as California evidence.
- The research lab and updated Minus-Eight Loop replay are live from commit `01ff7b2`. Production verification passed at desktop and 390 px: the research page has no horizontal overflow, expected HPI/mileage copy, and zero browser warnings or errors; the February replay serves its new title and closet commentary.
- The simulator can emit configurable finite static replay projections. Corrected seed `20440001` supplies `random-walk-san-francisco-california-marathon`: a 42.275 km, 3,124-sample public OSM-derived excerpt with deterministic commentary. Its replay desk includes an optional progress-synchronized Crystal coordinate cutaway packaged only after Goethite's unchanged H3 audit passed; the original black/mint renderer includes no game assets.
- The seeded marathon replay is live from commit `5465ceb` and linked from the research page and replay desk. Production verification passed at desktop and 390 px with zero horizontal overflow; 4× playback advanced to the computed 32.7% revisit call at 15% route progress. One non-blocking OpenFreeMap style warning requests a missing `wood-pattern` sprite; route, playback, and commentary remained functional.
- Relief overlays now enforce a single vertical datum: partial or invalid terrain profiles are rejected, sampling continues until every route sample has a finite DEM height, and the overlay remains withheld instead of mixing DEM, workout altitude, and sea level. Route-keyed terrain state prevents cross-replay reuse. Local verification passes strict TypeScript, clean ESLint, 51 tests, and the 21-page production build.
- The Hundred-City Random Walk League preseason is generated from 100 fresh OSM relation-boundary graphs and ten deterministic attempts per city. A 250-traversals-per-segment limit produces explicit censored results rather than guessed finishes; difficulty ranks completion rate first and normalized median distance second. The static aggregate contains 1,000 attempts, 55 cities with at least one DNF, and deterministic result-grounded commentary. Cape Coral ranks hardest and New Orleans least difficult under this versioned contract.
- Production verification for the California/Crystal correction passes Goethite's grid audit, 55 tests, strict TypeScript, clean ESLint, the 22-page production build, desktop cutaway seek/canvas checks, and 390 px replay/research no-overflow checks. The live cutaway advances to 19.1%, reports signal acquired, renders at 318 px on mobile, and produces zero browser errors. The known OpenFreeMap `wood-pattern` warning remains non-blocking locally.

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

After production verification, deepen the Hundred-City League seed count only as a separately labeled season update; do not silently overwrite the ten-seed preseason. Future refinement may replace conservative all-bridge exclusion with audited land geometry and suppress the provider's missing `wood-pattern` sprite warning if the basemap style does not resolve it upstream.

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
- Commit `01ff7b2` publishes the bridge-free random-walk field report and synchronized Minus-Eight Loop commentary; both production routes were verified after Vercel deployment.
- Commit `5465ceb` publishes the seeded random-walk marathon replay generator, static replay, research-page link, and `simulation` replay source boundary; production playback and responsive layout were verified.
- Commit `dacef22` publishes the measured Hundred-City League preseason, resumable simulator, frozen Census roster, result-grounded commentary, and full standings. Vercel production verification passed all 100 rows at desktop and 390 px with no page overflow or browser warnings/errors.
- Commit `5b3f691` corrects the San Francisco geography, publishes the new California marathon and audited Crystal coordinate cutaway, archives the Córdoba prototype from discovery, and is live on Vercel with mobile production acceptance.
