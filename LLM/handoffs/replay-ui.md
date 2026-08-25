# Replay UI specialist handoff

## Role

Implement the fixture-driven replay experience. OpenAI, GPX analysis, production persistence, push, and deployment are not authorized.

## Objective

Make `fixtures/demo-replay.json` drive a polished, responsive replay that satisfies the active gate in `LLM/current-handoff.md` without keys or generation calls.

## Read first

`AGENTS.md`, `LLM/current-handoff.md`, `LLM/product-charter.md`, and `fixtures/README.md`.

## In scope

- minimal Next.js/TypeScript application scaffold if not already present
- dark premium sports-analysis visual system without copied trade dress
- large MapLibre route view with completed route, current marker, start/finish, and notable events
- deterministic replay clock with play/pause/restart/scrub/speed and previous/next highlight
- synchronized current distance, remaining distance, elevation, grade, gain, commentary, and elevation profile
- Condensed, Highlights, and Instant Recap controls with honest bounded behavior
- responsive desktop/mobile layout, semantic controls, keyboard access, contrast, and reduced motion
- landing/upload presentation with demo entry; upload processing itself may remain clearly unavailable until parsing exists
- `docs/UI_DESIGN.md` and focused component/playback tests

Map tiles may degrade gracefully when offline; saved replay data and timeline behavior must not depend on API latency.

## Out of scope

OpenAI calls, commentary generation, GPX analysis implementation, database selection, authentication, external services, push, and deployment.

## Acceptance

The app loads the fixture and passes all six active product-gate behaviors. Build, TypeScript, lint, focused tests, responsive states, and fixture-only operation are verified.

## Stop condition

Stop after the fixture replay gate passes and documentation/state are updated. Do not begin the commentary adapter.
