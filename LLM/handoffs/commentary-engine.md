# Commentary specialist handoff

Status: blocked until the fixture-driven replay gate is accepted.

## Role

Implement server-only structured commentary generation from deterministic route summaries and selected events.

## Objective

Generate, validate, and store one concise broadcast package per route without sending raw samples or regenerating on replay.

## Read first

`AGENTS.md`, `LLM/current-handoff.md`, `LLM/product-charter.md`, the accepted route-analysis contract, and current persistence interface.

## In scope after unblock

- configurable server-only OpenAI adapter
- one call per ordinary route, or a very small bounded number for long routes
- structured schema with event IDs, valid speakers, concise text, and importance
- opening, synchronized lines, and finish recap
- clean/mildly-irreverent tone setting; default mildly irreverent
- schema validation, timeout, bounded retry, useful errors, usage/cost logging when available
- `.env.example` with no secret values
- mocked tests for schema failures, event correspondence, missing-line recovery, and proof raw samples are excluded
- `docs/COMMENTARY_ENGINE.md`

## Out of scope

Raw GPX/sample transmission, client credentials, one-call-per-event design, route facts, UI redesign, deployment, and push.

## Acceptance

Mocked tests prove only condensed facts/events enter the request and public replay loading never calls the generator. No live paid call is required for acceptance unless separately authorized.

## Stop condition

Stop after the adapter, validation, mocks, persistence seam, and documentation pass. Do not deploy or alter the replay design.
