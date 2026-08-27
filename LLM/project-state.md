# Project state

Updated: 2026-08-24.

## Implemented

- Milestone-zero replay fixture and source GPX.
- Fixture contract and acceptance criteria.
- Repository agent guide, product charter, operational handoff, role prompts, and reusable project skill.
- Next.js 15, React 19, TypeScript, deck.gl, a replaceable MapLibre supporting basemap, ESLint, and Vitest scaffold.
- Fixture-driven replay map, moving position, commentary synchronization, metrics, elevation profile, scrubber, replay speeds, restart, and highlight navigation.
- Responsive desktop/mobile presentation and reduced-motion handling.
- Framework-independent normalized route domain and WalkingLab schema-v1 importer.
- WalkingLab privacy projection excludes HealthKit UUIDs, device/source identifiers, update identity, export time, and absolute timestamps before analysis.
- GPX importer and deterministic versioned route analysis with segment-safe elevation math.
- A dependency-free TCX adapter projects only positioned trackpoints into the normalized route contract, discarding sensor-only points and metadata. Eight supplied historical TCX walks passed guarded import and owner location review; only their endpoint-trimmed curated replay projections are public, while raw inputs and mode-0600 candidates remain ignored.
- The February 2018 curated replay has owner-informed winter-loop commentary reduced to ten calls and synchronized to geometry-confirmed returns plus relative elapsed time. Owner memories supply the minus-eight-degree start and back-hall-closet story; deterministic route data supplies distance, duration, progress, and loop recurrence.
- The San Francisco random-walk research page now uses the verified California relation and the Hundred-City League's recorded graph/distribution. A coordinate audit proved the earlier name-only prototype selected San Francisco, Córdoba, Argentina; that replay is labeled as an archive and excluded from replay discovery rather than silently overwritten.
- A separate Hundred-City League applies the pure-random policy to the Census Vintage 2025 top-100 incorporated-place roster. Fresh OSM relation graphs, ten deterministic attempts per city, explicit censoring, resumable checkpoints, a static aggregate, result-grounded commentary, and a responsive full ranking are implemented without game mechanics or public runtime simulation.
- The research simulator can also emit a bounded `simulation` replay source. The published seed-20261178 marathon excerpt preserves actual graph traversal geometry, constant-speed relative time, computed revisit commentary, and the bridge-free HPI boundary without pretending the complete median walk is a practical web payload.
- A newly versioned California replay uses verified relation `111968`, seed `20440001`, 3,124 samples, and a 42.275 km excerpt. At 19.06% progress it exposes an optional Johto-correspondent cutaway built from Goethite's passed H3 grid audit. The visual is an original black/mint category rendering and includes no ROM, `.crystalpack`, or Pokémon artwork.
- Privacy-trimmed replay pipeline, deterministic fallback commentary, and optional one-time server-only OpenAI commentary.
- Deep replay schema validation at publish and build boundaries.
- Ignored mode-0600 candidate generation, local-only visual preview, and guarded curated-file publication.
- Static replay discovery, landing/replay desk, stable public replay URLs, share control, missing-route state, three replay modes, completed-route rendering, endpoints, and event markers.
- Mobile replay hierarchy promotes the current commentary call ahead of the map and hides older commentary history on small screens.
- Commentary supports an optional validated `displayProgress` for editorial beats between deterministic route events; all three live replays now contain ten commentary calls across the 90-second broadcast.
- deck.gl is the primary replay visualization boundary. A typed layer composer builds base/remaining/completed paths, current position, route events, active-event annotation, and start/finish markers; MapLibre/OpenFreeMap is a replaceable supporting basemap only.
- The former imperative MapLibre route-source component has been removed. Replay timing and interpolation remain independent application/domain logic.
- The replay map now offers Current, Hex Ghost, and Relief presentation modes. Hex Ghost derives a deterministic territory grid from route geometry; Relief preserves sample elevation in a pitched deck.gl trace. Both consume the existing normalized progress and create no new route facts.
- Relief now uses open Mapzen Terrarium DEM tiles from AWS Open Data for an actual MapLibre terrain surface and restrained hillshade. All deck.gl route markers and annotations share the elevated coordinate frame; Current and Hex Ghost remain flat.
- Relief presentation now samples the loaded DEM along the route so deck.gl overlays use the same display surface as MapLibre terrain. Hillshade sits below streets and labels; recorded GPS elevation remains unchanged as analytical evidence.
- The spatial root-cause audit proves WGS84/GeoJSON ordering, Web Mercator/XYZ tile math, Terrarium decoding, and five Multioak controls. The unexplained 3 m route lift is removed; MapLibre terrain camera clamping is disabled so deck.gl and MapLibre share one sea-level view frame. `?spatial-debug=1` exposes route/DEM bounds and controls.
- Relief enforces one complete DEM-derived vertical datum per route. Partial/non-finite profiles remain unrendered and are resampled instead of falling back to workout altitude or sea level; completed profiles are keyed to their replay ID.
- Two user-authorized WalkingLab routes are curated as `multioak-stairs` and `oakhurst-stairs`, with hand-authored commentary anchored to deterministic halfway events.

## Verified

- Demo replay is valid JSON.
- Demo GPX is valid XML.
- Commentary event IDs exist in the route event set.
- Event progress values are ordered and within `0...1`.
- TypeScript passes with strict checking.
- ESLint passes.
- Optimized production build passes and statically prerenders the replay page.
- Browser verification confirmed play/pause, deterministic commentary progression, highlight jumping, no horizontal overflow at 390 px, and no runtime errors.
- Public Vercel verification confirmed the replay, map, modes, controls, and mobile layout at `https://useless-walking-blog.vercel.app/replay/demo-championship-loop`.
- Both new curated replays pass deep replay validation and a forbidden-private-metadata key scan; Multioak uses the standard 200 m endpoint trim and the 190 m Oakhurst route uses a disclosed 10 m trim at each end.
- Live verification confirms all three replay cards, both new public replay pages, requested halfway commentary, map rendering, and zero horizontal overflow at 390 px.
- Dense-commentary timing is locally verified at roughly 9–14 seconds between editorial beats, aside from naturally clustered deterministic events.
- The deck.gl migration passes strict TypeScript, ESLint, 36 tests, a 10,000-point full-fidelity layer test, production static build, desktop browser acceptance, mobile playback acceptance at 390 px, and zero deck.gl runtime errors.
- Thirty-one tests pass across importers, analysis, commentary privacy/schema, replay math, pipeline privacy, fragmented-route rejection, and deep replay validation.
- The supplied private WalkingLab export passed a local count-only compatibility check: one segment, 2,257 samples, zero importer issues, and zero tested private-metadata leaks. No route values or identifiers were printed or committed.
- The city-league simulator has synthetic graph coverage for deterministic completion, censoring, summaries, and bridge/access filtering. The full suite passes 55 tests, strict TypeScript, and clean ESLint.
- The corrected California replay and Crystal cutaway pass the unchanged Goethite audit, replay schema/build loading, 55 tests, strict TypeScript, clean ESLint, the 22-page production build, desktop canvas/synchronization acceptance, and 390 px no-overflow acceptance. The only browser warning is the pre-existing OpenFreeMap `wood-pattern` sprite warning.
- The Relief datum invariant passes 51 tests, strict TypeScript, clean ESLint, the 21-page production build, and desktop/mobile visual acceptance on the February loop replay.

## External state

- No live OpenAI request.
- Two explicitly authorized real-route candidates were locally published into curated replay data; their ignored private candidates remain outside Git.
- V1 commit `e86c1c5cc0afbb3eb90dc6abf0d058ba0bed3c84` is pushed to `origin/main`.
- Curated replay and mobile-commentary commit `ec111f1` is pushed to `origin/main` and deployed.
- Commentary-cadence commit `b9860c7` is pushed to `origin/main` and deployed.
- deck.gl migration commit `25f1931` is pushed to `origin/main` and deployed.
- visualization-mode commit `be176cd` is pushed to `origin/main`; Hex Ghost and Relief are live and verified in production.
- DEM terrain commit `eed2ec0` is pushed to `origin/main`; Mapzen-backed Relief is live and verified on desktop and mobile.
- Hundred-City League commit `dacef22` is pushed to `origin/main`; the 100-city/1,000-attempt preseason table is live and verified on desktop and mobile.
- California/Crystal correction commit `5b3f691` is pushed to `origin/main`; the corrected research report and replay cutaway are live and verified at 390 px with no browser errors or horizontal overflow.
- V1 is deployed on Vercel at `https://useless-walking-blog.vercel.app`.

## Current gates

Three replays and the mobile commentary-first refinement are live. Future precise personal-location publication remains an explicit user-approval action. Future product ideas are isolated in `docs/NEXT_STEPS.md`.

The deck.gl migration is live on Vercel. Production verification confirms deck.gl plus the supporting basemap, no legacy route renderer, smooth mobile progress at 390 px, and correct event navigation on the 4,730-point Multioak route with zero runtime errors.
