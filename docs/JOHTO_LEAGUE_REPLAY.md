# Johto League replay bundle

`johto-league-san-francisco-exhibition` is a static Walking Ocho replay bundle: the corrected seeded San Francisco random-walk geometry, an audited Goethite coordinate-grid cutaway, deterministic elevation evidence, and ten original collaboration calls.

The narrative is informed by recurring themes in [Crystal LLM's public field notes](https://ryanculligan.com/crystal-agent-progress)—Ice Path loops, visible-but-unusable destinations, and the difference between possessing a map and making progress. It does not copy the site's prose, claim an official collaboration, use Pokémon artwork, or require a ROM/game pack. Commentary is stored with the replay and never generated on public load.

## Elevation boundary

Simulation routes do not contain workout altitude. `scripts/enrich-replay-elevation.ts` therefore samples Mapzen Terrarium DEM tiles from AWS Open Data at XYZ zoom 14, bilinearly interpolates one elevation per route coordinate, and passes the resulting evidence through the existing deterministic route analyzer. The replay stores the dataset, attribution, tile zoom, and sampling timestamp and labels its profile `DEM-derived`.

This is inferred terrain elevation, not barometric/GPS workout evidence. The horizontal transform reuses `src/lib/visualization/spatial-reference.ts`; no parallel Mercator implementation, visual offset, or route-specific correction exists.

```sh
pnpm enrich:replay-elevation \
  --input=data/replays/random-walk-san-francisco-california-marathon.json \
  --output=/tmp/sf-california-elevated.json \
  --zoom=14 \
  --sampled-at=2026-08-27T17:40:00.000Z

pnpm create:johto-league \
  --input=/tmp/sf-california-elevated.json \
  --output=data/replays/johto-league-san-francisco-exhibition.json
```

Both authoring commands refuse to overwrite their output. DEM requests occur only during explicit offline authoring; opening a public replay performs no elevation enrichment or commentary generation.
