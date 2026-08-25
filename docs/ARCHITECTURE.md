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

The V1 basemap is an understated OpenFreeMap dark style rendered by MapLibre through `react-map-gl`. It owns only tiles, labels, attribution, and geographic context. It receives deck.gl's camera state but receives no replay data. Swapping the provider or rendering deck.gl standalone must not change replay logic or layer composition.

## Route representation and performance

`ReplayRoute.samples` remains the canonical full-resolution sequence. Every sample already carries normalized progress, distance, coordinates, elevation, and grade, so future segment styling does not require a schema rewrite. Playback interpolation uses this source and remains accurate for compressed multi-hour walks.

Static visualization data is memoized per route. A progress update changes only the completed-path slice, current position, and active-event styling. Do not downsample imported evidence in place. If very large tracks require simplification, retain original samples and derive a separate visualization path that preserves endpoints and event anchors.

## Deployment and public sharing

The migration adds client-side WebGL packages but no service, database, token, API route, or server state. Public URLs and static replay JSON remain unchanged. If tiles fail, deck.gl still renders the route graphics against the broadcast-stage background.
