# Replay UI design

Status: initial fixture-driven replay, 2026-08-24.

## Visual system

The interface uses a near-black foundation, restrained green telemetry accent, compact uppercase labels, strong metric numerals, and bordered analytical surfaces. The styling intentionally resembles a credible sports-data control room without copying a broadcaster's identity. Humor is confined to commentary content.

## Desktop layout

The replay is a two-column grid:

- the map occupies the primary stage;
- the broadcast booth remains visible beside it;
- current metrics and the elevation profile sit immediately below the map;
- playback controls span the analysis column.

A compact scorebug overlays the map and reports progress, distance, and route time.

## Mobile layout

Below 900 px the layout becomes one column in product-priority order: commentary, route visualization, metrics/profile, controls. Controls become a sticky wrapping surface with the scrubber on its own row. Below 560 px, older commentary history is hidden, metrics use a two-column grid, and the fixture badge collapses to its status light. The page has no horizontal overflow at a verified 390 px viewport.

## Interaction model

The replay has a normalized `0...1` clock compressed to 90 seconds at 1×. Route samples are linearly interpolated for position, distance, elapsed route time, elevation, and grade. Commentary becomes visible when its linked event progress is reached.

Controls provide play/pause, restart, continuous scrubbing, 0.5×/1×/2×/4× speed, and previous/next major-event navigation. Clicking the elevation profile seeks to that route position. Condensed, Highlights, and Instant Recap are represented as mode controls; specialized timeline behavior remains a subsequent interaction tranche.

The map-stage toggle independently selects Current, Hex Ghost, or Relief. Current is the original broadcast map. Hex Ghost turns repeated territory into a subdued green cellular field whose visited cells appear as progress advances. Relief pitches the view, enables a real DEM terrain surface with restrained green hillshade, and uses replay-sample elevation for every broadcast overlay without changing the elevation chart or replay timing. The toggle is reachable above the map on desktop and spans the available width on mobile.

## Components

- `ReplayExperience`: replay clock, state, modes, metrics, commentary, and controls
- `RouteVisualization`: deck.gl host and replaceable quiet basemap adapter
- `buildRouteLayers`: reusable PathLayer, PolygonLayer, ScatterplotLayer, and TextLayer composition for route, progress, position, events, endpoints, territory cells, elevation trace, and active-event annotation
- `ElevationProfile`: compact SVG visualization and seek surface
- `replay-math`: framework-independent interpolation, formatting, and commentary timing

## Accessibility

Controls use native buttons, range input, select, and labels. Commentary uses a polite live region. The route visualization and elevation seek surface have accessible names. The route uses fixed fitted framing rather than camera-follow motion, and reduced-motion preference globally minimizes CSS motion.

## Current limitations

- The quiet public tile style requires network access; deck.gl route graphics remain the primary layer and do not depend on tile availability.
- Highlights uses a faster replay clock and filters the feed to important commentary. Instant Recap presents the finish state and deterministic summary immediately.
- The primary metric shows total verified gain; cumulative gain-so-far remains deferred until analysis exposes it per sample.
- Labels are deliberately compact; richer event annotation layout and collision handling remain deferred.

## Visualization hierarchy

The route is the visual subject. A muted full path communicates what remains, the green completed path advances from normalized replay progress, and the current-position halo is the strongest map-stage element. Event colors distinguish climbs/steep sections, summits/high points, halfway, finish, and other notable events. Start and finish are reusable deck.gl point and text layers rather than DOM markers.

The basemap is lower contrast and provides only roads, place context, and attribution. No replay behavior calls basemap APIs.
