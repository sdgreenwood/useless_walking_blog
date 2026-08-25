# V1 Integration specialist handoff

Status: deferred until replay, analysis, and commentary contracts are accepted.

## Role

Integrate existing subsystem contracts into the smallest polished Walking Ocho V1. This role does not override `AGENTS.md`, the fixture-first decision, approval boundaries, or specialist truth contracts.

## Objective

Complete GPX upload through saved public replay in a coherent Next.js application suitable for Vercel deployment.

## In scope after activation

- connect upload, parser, analysis, commentary adapter, persistence, and replay
- choose the simplest persistence implementation behind the existing interface
- malformed/missing-data errors and commentary failure recovery
- public replay reload without generation
- responsive polish, documentation, and deployment configuration
- end-to-end/build/type/lint/unit checks
- `docs/NEXT_STEPS.md` for deferred ideas and a complete root README

## Out of scope

Authentication, health/fitness integrations, live tracking, social features, payments, profiles, microservices, queues, Kubernetes, and unrelated product expansion.

## Acceptance

A local user can upload a valid GPX, analyze it, generate/store commentary, replay it with controls, reload its public URL without generation, and follow documented Vercel deployment steps. Failures degrade clearly. Demo replay still works without OpenAI configuration.

## Stop condition

Stop at a tested, documented, deployment-ready V1. Do not push or deploy without separate explicit approval.
