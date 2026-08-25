---
name: walking-ocho-delivery
description: Orient, plan, implement, review, or hand off work in the Walking Ocho repository while preserving its fixture-first gate, deterministic route-truth boundary, and role ownership.
---

# Walking Ocho delivery

Use this skill for work inside the Walking Ocho repository.

## Orient

Read `AGENTS.md` and `LLM/current-handoff.md`. Read `LLM/product-charter.md` when product scope or sequencing matters. Load only the relevant prompt from `LLM/handoffs/` for an assigned specialist role.

## Preserve the core boundaries

- Treat `fixtures/demo-replay.json` as the initial replay contract.
- Do not begin OpenAI integration until the current handoff records that the fixture-driven replay gate passed.
- Deterministic analysis owns facts; commentary receives only condensed summaries/events.
- Saved/public replay loading never generates commentary.
- Keep external mutations within the approval boundaries in `AGENTS.md`.

## Coordinate work

The PM/architect integrates cross-subsystem changes. Specialist agents receive one bounded handoff, respect its out-of-scope list, update relevant durable state, and stop at its stated condition. Do not activate every role prompt at once.

When a milestone changes implementation or blockers, update `LLM/project-state.md`. Rewrite `LLM/current-handoff.md` when the recommended next assignment or product gate changes. Record costly durable choices in `LLM/decisions/`.
