# Walking Ocho

Walking Ocho turns an ordinary historical walk into an absurdly serious sports replay. It combines deterministic route analysis with a polished MapLibre replay, synchronized commentary, elevation telemetry, public share URLs, and three viewing modes.

V1 is deliberately curated: private WalkingLab JSON or GPX is processed locally, privacy-trimmed, reviewed, and published as a static replay JSON file. The deployed application needs no database and never calls OpenAI when a replay is viewed.

## Stack

- Next.js 15, React 19, and strict TypeScript
- MapLibre GL JS with GeoJSON route geometry
- deterministic framework-independent route analysis
- optional server-only OpenAI Responses commentary generation
- Vitest and ESLint
- static replay files and Vercel hosting

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Verify

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Map tiles currently use OpenFreeMap's public dark style. The replay payload, timing, metrics, commentary, and controls are local; if tiles are unavailable, generation is still not required.

## Import a private route

WalkingLab schema-v1 JSON and ordinary GPX 1.0/1.1 tracks are accepted. The command defaults to deterministic commentary and trims 200 meters from each route end:

```bash
pnpm import:route -- \
  --input=/private/path/walk.json \
  --id=weekend-loop \
  --name="Weekend Loop"
```

To generate commentary once with OpenAI, copy `.env.example` to `.env.local`, set `OPENAI_API_KEY`, load it into the shell, and add `--commentary=openai`. The deployed site does not need this key.

The import produces an ignored, private candidate. Preview its precise route and commentary locally:

```bash
pnpm preview:route -- --candidate=private-imports/weekend-loop.candidate.json
```

Open `http://127.0.0.1:3000/preview`, complete the review checklist, stop the preview server, then publish it locally with the explicit privacy confirmation:

```bash
pnpm publish:route -- \
  --candidate=private-imports/weekend-loop.candidate.json \
  --confirm=I_REVIEWED_PRECISE_LOCATION
```

Run the full verification commands and inspect `/replay/weekend-loop` before committing. See [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Architecture

Both importers project into `NormalizedRoute`. `analyzeRoute()` produces versioned facts, samples, quality flags, and compact events. `buildReplay()` applies endpoint trimming and creates the self-contained public payload. Commentary receives only allowlisted route facts and events—never raw samples, coordinates, or GPX.

Curated files under `data/replays/` are discovered during build. The landing page lists them and Next.js pre-renders stable `/replay/<id>` pages. The replay clock, map, commentary, and controls operate entirely from that saved payload.

Key documents:

- [`docs/ROUTE_ANALYSIS.md`](docs/ROUTE_ANALYSIS.md)
- [`docs/COMMENTARY_ENGINE.md`](docs/COMMENTARY_ENGINE.md)
- [`docs/WALKINGLAB_IMPORT.md`](docs/WALKINGLAB_IMPORT.md)
- [`docs/UI_DESIGN.md`](docs/UI_DESIGN.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Deployment

The application is deployment-ready for Vercel. Connect the GitHub repository, retain the detected Next.js defaults, and set `NEXT_PUBLIC_SITE_URL` to the final origin. Deployment and Git push require explicit approval and have not been performed. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Known limitations

- Publishing is intentionally local/admin-only and requires a rebuild.
- Endpoint trimming is distance-based; every candidate still requires visual privacy review.
- Moving time currently equals elapsed duration.
- Map tiles require a third-party network service.
- The demo route is synthetic; real private routes are never test fixtures.

Deferred ideas live in [`docs/NEXT_STEPS.md`](docs/NEXT_STEPS.md).
