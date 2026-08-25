# 0003 — deck.gl primary visualization

Status: accepted, 2026-08-24.

## Context

Walking Ocho is a replay and sports-broadcast product, not a navigation client. The original MapLibre component owned route sources, progress styling, event markers, endpoints, the current position, camera movement, controls, and the basemap. That made future analytic overlays dependent on one map renderer and mixed replay graphics with geographic context.

## Decision

deck.gl is the primary visualization framework. Pure layer composition receives immutable route data plus normalized replay state and returns route, progress, position, event, endpoint, and annotation layers. The replay engine remains the sole owner of time and progress.

For V1, a quiet OpenFreeMap style is rendered through `react-map-gl/maplibre` as a replaceable child of deck.gl's reverse-controlled React integration. No route or replay behavior may call MapLibre APIs. The basemap may later be replaced or omitted without rewriting route layers.

## Consequences

- deck.gl `PathLayer`, `ScatterplotLayer`, and `TextLayer` own replay graphics.
- MapLibre remains supporting infrastructure only for geographic context and attribution.
- The route sample model remains the full-fidelity playback source; any future display simplification must be a separate derived representation.
- New analytics are added through the layer composer, not by mutating the basemap style.
- Frequently changing progress creates new layer props with stable layer IDs; deck.gl performs diffing and updates GPU resources as needed.
- The old imperative MapLibre route-source abstraction is removed rather than maintained in parallel.
