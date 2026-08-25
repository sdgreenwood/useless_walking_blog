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

## Verified

- Demo replay is valid JSON.
- Demo GPX is valid XML.
- Commentary event IDs exist in the route event set.
- Event progress values are ordered and within `0...1`.
- TypeScript passes with strict checking.
- ESLint passes.
- Optimized production build passes and statically prerenders the replay page.
- Browser verification confirmed play/pause, deterministic commentary progression, highlight jumping, no horizontal overflow at 390 px, and no runtime errors.
- Thirty-one tests pass across importers, analysis, commentary privacy/schema, replay math, pipeline privacy, fragmented-route rejection, and deep replay validation.
- The supplied private WalkingLab export passed a local count-only compatibility check: one segment, 2,257 samples, zero importer issues, and zero tested private-metadata leaks. No route values or identifiers were printed or committed.

## External state

- No live OpenAI request.
- No real private route candidate was written or published.
- V1 commit `e86c1c5cc0afbb3eb90dc6abf0d058ba0bed3c84` is pushed to `origin/main`.
- No Vercel deployment.

## Current gates

Product V1 is pushed and deployment-ready. Vercel deployment and publishing precise personal location remain explicit user-approval actions. Future product ideas are isolated in `docs/NEXT_STEPS.md`.
