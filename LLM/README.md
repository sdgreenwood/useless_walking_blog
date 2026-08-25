# Durable project memory

This directory lets future agents resume Walking Ocho without depending on chat history.

- `current-handoff.md`: bounded operational snapshot and default entry point.
- `project-state.md`: implementation, validation, and blockers.
- `product-charter.md`: product intent, V1 scope, sequencing, and non-goals.
- `agent-task-template.md`: format for new bounded assignments.
- `prompt-ledger.md`: accepted role prompts and their status.
- `decisions/`: durable architectural decision records.
- `handoffs/`: scoped agent prompts and eventual result receipts.

`AGENTS.md` contains stable working rules. Do not duplicate them in every prompt. Rewrite the current handoff at milestones; historical narrative belongs in project state or decisions.
