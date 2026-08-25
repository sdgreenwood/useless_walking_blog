# 0002 — Curated file publishing

Status: accepted, 2026-08-24.

## Context

V1 will publish a small number of the owner's routes sourced from WalkingLab or GPX. A public upload service and database would add abuse controls, storage, authentication, privacy risk, and operating cost without improving the initial product.

## Decision

Walking Ocho uses a local/admin import pipeline and reviewed replay JSON committed under `data/replays/`. The application statically generates public replay URLs on Vercel. Raw source routes and pre-review candidates remain ignored and private.

OpenAI commentary, when chosen, runs only during the local import. Deterministic commentary provides a no-key fallback. Public page requests have no generation code path.

## Consequences

- No database, object storage, accounts, or public upload endpoint is required.
- Publishing a route requires a rebuild/deploy.
- The guarded publish command requires explicit location review confirmation.
- A future public uploader would require a new persistence/privacy/abuse-control decision and must not silently reuse this trust model.
