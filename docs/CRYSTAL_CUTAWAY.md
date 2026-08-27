# Crystal coordinate cutaway

Status: corrected San Francisco, California proof implemented from public data.

## Product boundary

The replay desk owns route truth, normalized progress, commentary timing, and publication. Goethite's `crystal-mapgen` owns the deterministic conversion from public geography into an audited Crystal-style grid. The integration exchanges static JSON; neither project imports the other's domain implementation, and no generation occurs on a public request.

The V1 visual is an original black/mint canvas rendering of Goethite's grid categories. It includes no Pokémon tiles, ROM data, `.crystalpack`, extracted graphics, audio, or generated game runtime.

## Corrected source

The earlier replay labeled San Francisco came from an ambiguous name-only Overpass query and contains coordinates in San Francisco, Córdoba, Argentina. It is preserved at its stable URL as an explicitly labeled archive and excluded from replay discovery.

The corrected replay uses:

- OSM relation `111968`;
- display identity `San Francisco, California, United States`;
- OSM timestamp `2026-08-27T16:21:02Z`;
- deterministic seed `20440001`;
- 42.275 km bounded excerpt;
- 3,124 route samples;
- replay ID `random-walk-san-francisco-california-marathon`.
- replay ID `johto-league-san-francisco-exhibition` reuses the same passed public-geography grid as a standalone narrative exhibition; see `docs/JOHTO_LEAGUE_REPLAY.md`.

The research article now reads its California graph and distribution from the checked-in Hundred-City League aggregate instead of retaining the invalid Córdoba measurements.

## Cutaway artifact flow

```text
corrected replay sample at 19.06% progress
    -> longitude/latitude on the public route
    -> crystal-mapgen H3 resolution 8 / 96x96 grid
    -> unchanged Goethite audit
    -> package-crystal-cutaway.ts
    -> static JSON artifact
    -> replay-progress-triggered canvas cutaway
```

The published cell is `8828308299fffff`. Several other real replay cells/configurations failed Goethite's unchanged ledge, stair, fence, or coverage gates and were not packaged. The accepted cell reports 100% walkable reach, 37 houses, and three wild sites.

## Reproduction

Goethite source commit:

```text
0b40bbfce9c95c38c3a6b4a890206667cb11fd0b
```

Generate the audited data-only cell from a Goethite checkout:

```bash
cargo run -p crystal-mapgen -- \
  --lat 37.7721574 \
  --lon -122.4473064 \
  --h3-res 8 \
  --h3-generate-cells 1 \
  --grid 96 \
  --output-dir /tmp/walkingblog-sf-crystal-route-west-r8
```

Do not pass `--h3-render-proof` without a legally generated local base pack. Goethite intentionally does not distribute game assets.

Package only a passed audit:

```bash
npm run package:crystal-cutaway -- \
  --grid=/tmp/walkingblog-sf-crystal-route-west-r8/cells/0000-8828308299fffff/grid.json \
  --audit=/tmp/walkingblog-sf-crystal-route-west-r8/cells/0000-8828308299fffff/audit.json \
  --id=sf-california-random-marathon-west \
  --replay-id=random-walk-san-francisco-california-marathon \
  --progress=0.19061812858822583 \
  --generator-commit=0b40bbfce9c95c38c3a6b4a890206667cb11fd0b \
  --output=data/research/crystal-cutaways/sf-california-random-marathon-west.json
```

The packager rejects failed audits, invalid progress, and malformed grid dimensions. The public component consumes only the packaged artifact.

## Future extension

Additional cutaways can reuse the same schema. A full H3 corridor should remain a later version: generate and audit each cell, preserve progress-to-cell timing, and never substitute a nearby successful cell for a failed cell without clearly changing the editorial event.
