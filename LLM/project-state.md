# Project state

Updated: 2026-08-24.

## Implemented

- Milestone-zero replay fixture and source GPX.
- Fixture contract and acceptance criteria.
- Repository agent guide, product charter, operational handoff, role prompts, and reusable project skill.
- Next.js 15, React 19, TypeScript, MapLibre, ESLint, and Vitest scaffold.
- Fixture-driven replay map, moving position, commentary synchronization, metrics, elevation profile, scrubber, replay speeds, restart, and highlight navigation.
- Responsive desktop/mobile presentation and reduced-motion handling.
- Framework-independent normalized route domain and WalkingLab schema-v1 importer.
- WalkingLab privacy projection excludes HealthKit UUIDs, device/source identifiers, update identity, export time, and absolute timestamps before analysis.
- GPX importer and deterministic versioned route analysis with segment-safe elevation math.
- Privacy-trimmed replay pipeline, deterministic fallback commentary, and optional one-time server-only OpenAI commentary.
- Deep replay schema validation at publish and build boundaries.
- Ignored mode-0600 candidate generation, local-only visual preview, and guarded curated-file publication.
- Static replay discovery, landing/replay desk, stable public replay URLs, share control, missing-route state, three replay modes, completed-route rendering, endpoints, and event markers.
- Mobile replay hierarchy promotes the current commentary call ahead of the map and hides older commentary history on small screens.
- Commentary supports an optional validated `displayProgress` for editorial beats between deterministic route events; all three live replays now contain ten commentary calls across the 90-second broadcast.
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
- Thirty-one tests pass across importers, analysis, commentary privacy/schema, replay math, pipeline privacy, fragmented-route rejection, and deep replay validation.
- The supplied private WalkingLab export passed a local count-only compatibility check: one segment, 2,257 samples, zero importer issues, and zero tested private-metadata leaks. No route values or identifiers were printed or committed.

## External state

- No live OpenAI request.
- Two explicitly authorized real-route candidates were locally published into curated replay data; their ignored private candidates remain outside Git.
- V1 commit `e86c1c5cc0afbb3eb90dc6abf0d058ba0bed3c84` is pushed to `origin/main`.
- Curated replay and mobile-commentary commit `ec111f1` is pushed to `origin/main` and deployed.
- V1 is deployed on Vercel at `https://useless-walking-blog.vercel.app`.

## Current gates

Three replays and the mobile commentary-first refinement are live. Future precise personal-location publication remains an explicit user-approval action. Future product ideas are isolated in `docs/NEXT_STEPS.md`.
