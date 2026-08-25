# Route Analysis specialist handoff

## Role

Implement the deterministic GPX normalization and route-analysis subsystem. Do not generate commentary or build UI.

## Objective

Expose a small typed function that converts valid/noisy GPX-derived samples into trustworthy statistics, quality flags, and an ordered compact event stream compatible with the replay contract.

## Read first

`AGENTS.md`, `LLM/current-handoff.md`, `LLM/product-charter.md`, and `fixtures/README.md`.

## In scope

- typed normalized samples with optional time/elevation
- cumulative distance/progress; duration and speed when possible
- defensible smoothing for speed/elevation/grade
- elevation gain/loss, climbs/descents, milestones, extrema, halfway, finish
- stable event IDs, reasons, importance, coordinates, metrics, and optional elapsed time
- quality flags for missing data, duplicates, jumps, sparsity, and elevation spikes
- deterministic absurdity metrics that contain facts rather than jokes
- synthetic tests for flat, climbing, rolling, noisy, missing, tiny, long, and GPS-jump routes
- `docs/ROUTE_ANALYSIS.md` explaining algorithms, thresholds, tradeoffs, and limitations

Target 15–25 events for short routes, 20–40 for normal routes, and at most roughly 60 for unusually long routes. Suppress or combine nearby low-value events.

## Out of scope

Commentary, model calls, maps/UI, persistence, geographic claims, and hard-coded humorous prose.

## Acceptance

Tests verify distance tolerances, event order/count, stable IDs, climb behavior, malformed/missing-data degradation, and compatibility with shared domain types. Report exact checks and any intentional fixture-contract changes.

## Stop condition

Stop when the independent analysis module, tests, and documentation pass. Do not begin commentary or UI integration.
