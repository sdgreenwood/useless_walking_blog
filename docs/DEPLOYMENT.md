# Vercel deployment

Walking Ocho is a statically generated Next.js application with public MapLibre tiles. It needs no database or writable production filesystem.

## Before deployment

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
3. Inspect every file under `data/replays/` and confirm it is intentionally public.
4. Confirm no raw/candidate route or secret is tracked.

## Vercel setup

Import the GitHub repository into Vercel and keep the detected Next.js defaults. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin so metadata URLs are correct.

`OPENAI_API_KEY` is not needed by the deployed site because commentary is generated during local import. Do not configure it in Vercel unless a separately approved server-side administration flow is added later.

Each merge to the production branch creates a new static deployment. Curated replay JSON is read during build and produces `/replay/<id>` pages. Page views do not write files or contact OpenAI.

## Map service

V1 uses OpenFreeMap's public dark style with visible required attribution. Review the tile provider's current service terms and capacity before meaningful traffic or commercial use; replacing the style URL does not change the replay data architecture.

## Rollback

Use Vercel's prior-deployment rollback. Do not delete or rewrite Git history to remove a mistakenly published private route; immediately remove it from the current tree, redeploy, and follow GitHub/Vercel sensitive-data remediation procedures.
