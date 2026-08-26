# Implementation plan

Status: deck.gl migration plan, 2026-08-24.

## V1 migration

1. Record deck.gl as the primary visualization boundary and keep the basemap replaceable.
2. Introduce typed visualization state and a pure `buildRouteLayers()` composition function.
3. Render the route with `PathLayer`; render current position, events, and endpoints with reusable `ScatterplotLayer` and `TextLayer` instances.
4. Keep normalized playback progress and sample interpolation in `ReplayExperience` / `replay-math`.
5. Use deck.gl as the reverse-controlled root and the existing dark OpenFreeMap style only as a quiet supporting basemap.
6. Remove imperative MapLibre sources, layers, marker updates, camera-follow effects, and obsolete route-map code.
7. Verify fixture and curated routes at desktop and mobile sizes, including play, scrub, event navigation, map fallback, and public static generation.

## Consequences to manage

- **Playback:** no timing changes; layers derive from `progress`, `current`, and `activeEvent`.
- **Data model:** keep full replay samples and typed GeoJSON-order coordinates; future display simplification is derived and lossless with respect to playback/event anchors.
- **Components:** `ReplayExperience` orchestrates; `RouteVisualization` hosts deck.gl; `buildRouteLayers` is framework-light composition; the basemap is a child adapter.
- **Deployment:** larger client bundle and WebGL2 requirement; no new runtime service or token.
- **Basemap:** OpenFreeMap/MapLibre remains V1 context only and can be replaced behind the visualization host.
- **Sharing:** stable static replay URLs and payloads remain unchanged.
- **Mobile:** retain fixed route framing, large current-position contrast, commentary-first page hierarchy, and native playback controls.
- **Analytics:** add new immutable layer builders using existing sample attributes; do not place analysis logic inside layers.

## Deferred work

Grade/pace coloring, route density, comparative traces, beauty/suffering/absurdity overlays, and live commentary effects are intentionally deferred until a product need selects them. The selected V1 visualization extensions are complete: Current, Hex Ghost, and Relief share one replay state and one layer-composition boundary.
