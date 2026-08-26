# Vercel deployment

Walking Ocho is a statically generated Next.js application with client-side deck.gl replay layers and a public supporting basemap. It needs no database or writable production filesystem.

## Before deployment

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
3. Inspect every file under `data/replays/` and confirm it is intentionally public.
4. Confirm no raw/candidate route or secret is tracked.

## Vercel setup

Import the GitHub repository into Vercel and keep the detected Next.js defaults. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin so metadata URLs are correct.

`OPENAI_API_KEY` is not needed by the deployed site because commentary is generated during local import. Do not configure it in Vercel unless a separately approved server-side administration flow is added later.

Each merge to the production branch creates a new static deployment. Curated replay JSON is read during build and produces `/replay/<id>` pages. Page views do not write files or contact OpenAI.

## Visualization and map service

deck.gl renders every route, progress, position, endpoint, and event layer. V1 uses OpenFreeMap's public dark style through MapLibre only for understated geographic context and visible required attribution. Review the tile provider's current service terms and capacity before meaningful traffic or commercial use. Replacing or removing the basemap does not change replay data, playback, or deck.gl layer composition.

Relief mode requests Mapzen Terrarium elevation tiles from the AWS Open Data `elevation-tiles-prod` bucket and displays the source attribution through MapLibre. No key is required. These requests disclose the visible route area to AWS; this was explicitly approved by the owner. For higher reliability or stricter privacy later, preserve the same `raster-dem` boundary and replace the public URL with route-local or self-hosted DEM tiles.

## Rollback

Use Vercel's prior-deployment rollback. Do not delete or rewrite Git history to remove a mistakenly published private route; immediately remove it from the current tree, redeploy, and follow GitHub/Vercel sensitive-data remediation procedures.
