# Walking Ocho product charter

Status: initial V1 charter, 2026-08-24.

## Purpose

Walking Ocho turns a historical walk into a polished animated sports replay with absurdly serious, metric-aware commentary. The presentation should look like a legitimate premium sports-analysis product; humor comes from applying that seriousness to ordinary walking.

## V1 promise

The owner can privately import a WalkingLab JSON or GPX file, receive deterministic route analysis, optionally generate structured commentary once, preview and privacy-review the candidate, and publish a static replay. Visitors can watch, control, and share that replay at a public URL without a model call or database.

## Product sequence

1. Synthetic demo fixture and replay contract.
2. Polished fixture-driven replay with playback, scrubbing, speed, and highlights.
3. WalkingLab/GPX parsing and deterministic analysis.
4. Private candidate preview, guarded publication, and public replay loading.
5. Server-only, import-time OpenAI commentary generation from condensed events.
6. Integration polish and Vercel readiness.

`DECISION`: no OpenAI work begins before step 2 passes its product gate.

## V1 scope

- local/admin WalkingLab JSON and GPX import with graceful validation
- GeoJSON/internal normalization
- distance, duration, elevation, grade, climb, milestone, and quality analysis
- a compact deterministic event stream
- stored structured commentary tied to event IDs
- map replay, elevation profile, synchronized feed, playback controls, highlights
- responsive dark-mode desktop/mobile experience
- private candidate preview and public replay URLs without authentication

## Explicit non-goals

Authentication, health/fitness integrations, live GPS, social features, payments, profiles, historical comparisons, weather, computer vision, route recommendations, native apps, and complex GIS or distributed infrastructure.

## Truth and tone

- Route facts come only from deterministic inputs and calculations.
- Commentary never invents geographic or route facts.
- Jokes remain concise, non-mean-spirited, and clearly distinguishable from computed facts.
- Do not copy broadcaster branding, trade dress, characters, or dialogue.

## Technical direction

Next.js, React, TypeScript, deck.gl, and GeoJSON-compatible typed coordinates in a modular monolith deployable to Vercel. deck.gl owns replay visualization; the V1 MapLibre/OpenFreeMap basemap is replaceable supporting context only. Reviewed replay JSON is committed and statically generated; raw inputs and candidates remain private and ignored. No database is used. OpenAI is optional during local import and absent from public replay reads.
