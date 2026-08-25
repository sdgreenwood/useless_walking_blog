# 0001 — Fixture-first delivery

Status: accepted, 2026-08-24.

## Context

Replay UI, route analysis, persistence, and commentary need a shared contract. Beginning with model generation would require credentials, consume calls, and make deterministic development harder.

## Decision

The synthetic replay fixture is milestone zero. The replay must meet the interaction gate in `LLM/current-handoff.md` before OpenAI integration begins.

## Consequences

- UI work is fully testable offline.
- Route analysis has a concrete output shape to reproduce or intentionally revise.
- Commentary is hand-authored and marked `source: "fixture"` until the gated adapter is built.
- Any fixture contract revision must coordinate its consumers and update durable documentation.
