# Curated public replays

Only reviewed, publishable replay JSON belongs here. Raw GPX, WalkingLab exports, candidate files, HealthKit identifiers, precise absolute timestamps, and device metadata are prohibited.

Use `pnpm import:route` to create an ignored, mode-0600 candidate under `private-imports/`. Inspect the route and commentary, then use the guarded `pnpm publish:route` command. Files are named `<route-id>.json`; the application builds them into stable `/replay/<route-id>` pages.
