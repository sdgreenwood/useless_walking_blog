# Walking Ocho agent guide

## Start here

1. Inspect `git status` and preserve unrelated work.
2. Read `LLM/current-handoff.md` for the bounded operational snapshot.
3. Read `LLM/product-charter.md`, then only the role handoff and code relevant to the assignment.
4. Treat `fixtures/demo-replay.json` as the initial replay contract.

## Product rules

- Build only the public GPX-to-replay V1 described in `LLM/product-charter.md`.
- Deterministic analysis owns route facts. Commentary may present supplied facts but must not invent them.
- Never send raw GPX tracks or route samples to a model.
- Opening or replaying a saved/public route must never generate commentary.
- The fixture-driven replay must work before OpenAI integration begins.
- The demo fixture is synthetic/fictionalized and must remain usable without keys, databases, or network access.
- Keep secrets server-side and never commit them.
- Do not add authentication, social features, payments, live tracking, or complex infrastructure.

## Ownership and handoffs

- The PM/architect coordinates sequencing, resolves cross-subsystem contracts, and integrates accepted work.
- Route Analysis owns parsing, normalization, metrics, data quality, and deterministic event generation.
- Replay UI owns fixture-driven rendering, playback, accessibility, and responsive interaction.
- Commentary owns the server-only model adapter and stored structured output, but remains blocked until the UI product gate in `LLM/current-handoff.md` is satisfied.
- V1 Integration owns cross-system completion only after subsystem contracts exist; it does not replace specialist ownership.

Task prompts live in `LLM/handoffs/`. They are scoped assignments, not standing authority. A spawned agent must stop at its prompt's stop condition and leave integration to the PM/architect.

## Engineering conventions

- Use TypeScript and keep domain modules independent of React where practical.
- Use GeoJSON coordinate order: longitude, latitude. Base units are meters and seconds; route progress is `0...1`.
- Keep route analysis deterministic, versioned, and testable with synthetic inputs.
- Prefer a small modular monolith suitable for Next.js on Vercel.
- Record durable choices with meaningful alternatives or migration cost in `LLM/decisions/`.
- Rewrite `LLM/current-handoff.md` at integration milestones; do not append a work diary.
- Update `LLM/project-state.md` when implementation, validation, or blockers materially change.

## Completion evidence

A change is complete only when relevant tests pass, TypeScript/build checks pass where available, fixture compatibility is preserved, and durable documentation reflects the result. Report exact checks and unresolved gates; do not claim OpenAI, deployment, or public persistence behavior without direct evidence.

## Approval boundaries

Explicit user approval remains required for pushes, deployments, paid services, and transmitting personal route data. Never commit real private routes, API keys, or tokens.
