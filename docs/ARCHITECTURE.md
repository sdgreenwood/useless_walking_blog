# Architecture

Status: deck.gl visualization architecture, 2026-08-24.

## System boundaries

```text
WalkingLab / GPX
       ↓
private import + deterministic analysis
       ↓
reviewed ReplayDocument
       ↓
Replay Engine (progress 0...1, current sample, active event)
       ↓
Visualization State
       ↓
buildRouteLayers()
       ↓
deck.gl layers
       ↓
optional quiet basemap
```

Route analysis, geographic lookup, privacy trimming, commentary, and publishing do not import deck.gl. The replay engine owns playback timing and interpolation. The visualization consumes its results and never advances time itself.

## Visualization ownership

deck.gl owns the complete route, remaining route, completed route, current-position halo and dot, route events, active-event emphasis, start/finish marks, and compact annotations. `buildRouteLayers()` is the only composition entry point. Stable layer IDs make the update boundary explicit and leave room for grade, pace, elevation, density, comparison, and editorial-effect layers.

The replay exposes three presentation modes over that same state. Current retains the quiet street context. Hex Ghost adds deterministic polygon cells derived solely from route geometry and colors visited territory from normalized progress. Relief Broadcast preserves sample elevation as the third coordinate, pitches the deck.gl view, and renders the route as an elevated analytical trace. These are presentation choices: they do not alter samples, metrics, commentary timing, or the replay clock.

The V1 basemap is an understated OpenFreeMap dark style rendered by MapLibre through `react-map-gl`. It owns tiles, labels, attribution, and geographic context. Relief mode additionally enables open Mapzen Terrarium DEM tiles hosted by AWS Open Data as a MapLibre terrain surface. Hillshade is inserted below street and label layers so geographic context stays crisp. Once visible DEM tiles are idle, their elevations are sampled along the route and become the shared display datum for the route, current position, endpoints, events, and annotations. MapLibre terrain camera clamping is disabled so its sea-level camera reference matches reverse-controlled deck.gl. Recorded GPS elevation remains the analytical evidence and continues to drive metrics/profile; DEM elevation is presentation-only. Current and Hex Ghost remain flat. The full CRS, XYZ, decoder, camera, and control-point proof is in `docs/SPATIAL_PIPELINE.md`.

## Route representation and performance

`ReplayRoute.samples` remains the canonical full-resolution sequence. Every sample already carries normalized progress, distance, coordinates, elevation, and grade, so future segment styling does not require a schema rewrite. Playback interpolation uses this source and remains accurate for compressed multi-hour walks.

Static visualization data is memoized per route. A progress update changes only the completed-path slice, current position, and active-event styling. Do not downsample imported evidence in place. If very large tracks require simplification, retain original samples and derive a separate visualization path that preserves endpoints and event anchors.

## Deployment and public sharing

The migration adds client-side WebGL packages but no service, database, token, API route, or server state. Public URLs and static replay JSON remain unchanged. Activating Relief requests public DEM tiles for the visible geographic area from AWS Open Data; owner approval for that location disclosure was recorded in the implementation conversation. If terrain or basemap tiles fail, deck.gl still renders the route graphics against the broadcast-stage background.
