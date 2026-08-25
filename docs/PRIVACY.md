# Route privacy and publishing

Walking routes are precise location history. Walking Ocho treats raw WalkingLab JSON and GPX as private input, even when the intended replay will eventually be public.

## Data stages

1. **Raw input:** remains outside Git. It may contain coordinates, absolute timestamps, HealthKit identifiers, device metadata, and source provenance.
2. **Private candidate:** stored mode-0600 under ignored `private-imports/`. It contains publishable coordinates and therefore remains sensitive.
3. **Curated replay:** contains only relative timing, analyzed metrics/events, commentary, and reviewed route geometry. It is intentionally public and committed under `data/replays/`.

WalkingLab import removes HealthKit UUIDs, update identities, device/source details, export time, and absolute timestamps. GPX import reads only track geometry, relative time, and elevation. Neither importer makes coordinates anonymous.

## Default protection

The import command trims 200 meters from both ends by default. Trimming is a convenience, not proof of safety. `pnpm preview:route -- --candidate=private-imports/<id>.candidate.json` serves the ignored candidate only on local loopback at `/preview`; it is unavailable in production. A reviewer must inspect the first/last published points, the complete route, habitual locations, and all commentary before publishing.

The publish command accepts only ignored candidate files and requires the exact confirmation `I_REVIEWED_PRECISE_LOCATION`. It refuses to overwrite an existing curated replay.

## Prohibited repository data

Never commit raw exports, candidate files, private GPX/JSON, home/work labels, HealthKit UUIDs, device identifiers, API keys, or absolute workout timestamps. Git history is durable; removing a later commit does not reliably erase sensitive data.
