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

Below 900 px the layout becomes one column in product-priority order: map, metrics/profile, commentary, controls. Controls become a sticky wrapping surface with the scrubber on its own row. Below 560 px, metrics use a two-column grid and the fixture badge collapses to its status light. The page has no horizontal overflow at a verified 390 px viewport.

## Interaction model

The replay has a normalized `0...1` clock compressed to 90 seconds at 1×. Route samples are linearly interpolated for position, distance, elapsed route time, elevation, and grade. Commentary becomes visible when its linked event progress is reached.

Controls provide play/pause, restart, continuous scrubbing, 0.5×/1×/2×/4× speed, and previous/next major-event navigation. Clicking the elevation profile seeks to that route position. Condensed, Highlights, and Instant Recap are represented as mode controls; specialized timeline behavior remains a subsequent interaction tranche.

## Components

- `ReplayExperience`: replay clock, state, modes, metrics, commentary, and controls
- `RouteMap`: MapLibre style, route line, moving position, and fitted bounds
- `ElevationProfile`: compact SVG visualization and seek surface
- `replay-math`: framework-independent interpolation, formatting, and commentary timing

## Accessibility

Controls use native buttons, range input, select, and labels. Commentary uses a polite live region. The map and elevation seek surface have accessible names. Reduced-motion preference suppresses camera-follow animation and globally minimizes CSS motion.

## Current limitations

- The public tile style requires network access and emits a harmless missing optional sprite warning.
- Highlights uses a faster replay clock and filters the feed to important commentary. Instant Recap presents the finish state and deterministic summary immediately.
- The primary metric shows total verified gain; cumulative gain-so-far remains deferred until analysis exposes it per sample.
- Route start/finish and notable-event map markers remain to be added.
