# Spatial pipeline proof

Status: engineering root-cause review, 2026-08-26.

## Root cause

The app never constructed a custom terrain mesh. MapLibre decoded and rendered the DEM in its canvas; deck.gl rendered replay geometry in a second canvas. Horizontal inputs were consistent, but MapLibre terrain defaults `centerClampedToGround` to true, moving its camera center to terrain elevation. deck.gl continued to use the reverse-controlled sea-level view state. At nonzero pitch, identical longitude/latitude therefore passed through different camera matrices.

The previous refinement sampled MapLibre terrain and added an unexplained 3 m route lift. A shared height did not create a shared camera. The lift is removed, and `setCenterClampedToGround(false)` now keeps both renderers in the same sea-level camera frame.

## Route: source to pixels

WalkingLab and GPX inputs are normalized immediately to GeoJSON `[longitude, latitude]` in WGS84 degrees. Analysis and replay JSON preserve that order. deck.gl receives `[longitude, latitude]` for flat modes or `[longitude, latitude, absoluteAltitudeMeters]` for Relief. Its default geospatial coordinate system projects them into Web Mercator and through the shared view state. Rendering uses no radians, model matrix, coordinate origin, CSS transform, route-specific offset, or application Mercator conversion.

## Basemap: source to pixels

OpenFreeMap supplies OpenMapTiles vector geometry derived from OpenStreetMap. MapLibre accepts WGS84 `[longitude, latitude]` degrees and owns vector-tile extent conversion and Web Mercator projection. Reverse-controlled deck.gl supplies longitude, latitude, zoom, pitch, and bearing. MapLibre's terrain camera center is now explicitly fixed to sea level so the two canvases use the same camera reference.

## Terrain: source to pixels

Relief uses Mapzen Terrain Tiles from AWS Open Data at `terrarium/{z}/{x}/{y}.png`. These are 256 px, zoom 0–15, EPSG:3857 tiles in standard XYZ order: x increases east, y increases south, origin northwest. No TMS y inversion occurs. OpenFreeMap's TileJSON declares vector data through zoom 14, so the renderer intentionally caps both DEM sources at z14 and overzooms them together; this avoids mixing a z15 terrain transform with z14 street geometry.

MapLibre places each tile at its Web Mercator footprint and decodes meters as `(R × 256 + G + B / 256) − 32768`. It privately constructs/stitches the mesh; the app performs no pixel interpolation, edge/center choice, row inversion, mesh indexing, or model transform. Hillshade and terrain use separate MapLibre sources with the identical DEM URL/configuration, as recommended by MapLibre, and terrain uses exaggeration 1. Hillshade is below roads/labels.

For Relief overlays, `queryTerrainElevation([longitude, latitude])` supplies MapLibre's absolute display height at every sample; deck.gl uses the same horizontal tuple and that z value. The overlay is withheld while any DEM result is null or non-finite, and sampling continues after terrain-idle events until the profile is complete. Partial DEM profiles are never combined with recorded workout altitude or sea level. Recorded GPS elevation remains the independent analysis/chart evidence.

## Explicit conventions

| Concern | Route/deck.gl | Basemap/MapLibre | DEM/MapLibre |
| --- | --- | --- | --- |
| Source CRS | WGS84 / EPSG:4326 | provider geometry normalized by renderer | EPSG:3857 tiles |
| App order | longitude, latitude | longitude, latitude | z/x/y; queries longitude, latitude |
| Angular units | degrees | degrees | queries in degrees |
| Axes/origin | east, north, up | Web Mercator northwest internally | XYZ northwest; x east; y south |
| Altitude | absolute meters | camera fixed to sea-level reference | decoded absolute meters |
| Exaggeration | none | none | 1 |

All pipelines join at WGS84 `[longitude, latitude]` degrees and one reverse-controlled Web Mercator camera. Terrain and basemap join inside MapLibre. Route and terrain join through the same geographic tuple and decoded DEM height.

## Tile and control proof

The Multioak midpoint `[-122.4601008185748, 37.75554572414912]` resolves at the renderer's zoom 14 to XYZ `14/2618/6333`. Tests calculate that independently, invert tile bounds, and prove that start, 25%, 50%, 75%, and finish lie inside their expected DEM footprints. The same five controls round-trip through normalized Web Mercator. The published Terrarium sample `RGB(137,219,68)` decodes to `2523.265625 m`.

## Diagnostic mode

Append `?spatial-debug=1` to a replay URL. It forces bearing 0, pitch 0, and no exaggeration change, and displays:

- route and route bounding box;
- requested zoom-14 DEM XYZ boundaries;
- five labeled control points and their z/x/y;
- MapLibre's own tile boundaries;
- CRS/order/units/DEM/camera configuration;
- tapped longitude/latitude and calculated DEM tile.

There is no app-owned terrain wireframe to expose because MapLibre owns the private mesh. DEM tile boundaries are its inspectable geographic contract. If mesh-level ownership is needed, replace this stack with deck.gl `TerrainLayer` and its experimental `TerrainExtension`; do not add a parallel custom mesh.

## Prior fix audit

| Change | Classification | Disposition |
| --- | --- | --- |
| Mapzen Terrarium, tile size 256, data z0–15 | Proven source contract | Retained; renderer capped at z14 to match basemap TileJSON |
| Hillshade below roads/labels | Presentation-only | Retained |
| DEM sampling for deck.gl z | Necessary in split renderer | Retained |
| GPS/sea-level fallback for partial DEM sampling | Mixed vertical datums inside one overlay | Removed; Relief waits for one complete DEM profile |
| `+3 m` route lift | Unexplained compensation | Removed |
| Relief max view zoom 15 | Source-resolution bound | Retained |
| Pitch 38°, bearing −12° | Presentation, not correction | Retained; debug uses 0°/0° |
| MapLibre center clamped to terrain | Proven camera divergence | Disabled |

## Elevation limits and deck.gl-native option

Mapzen combines SRTM and other public sources; contributing vertical datums vary and need not equal the GPS altitude datum. Null/failed DEM samples never replace route facts. Horizontal alignment is therefore tested separately from height agreement.

deck.gl `TerrainLayer` can natively load `{z}/{x}/{y}` height maps, and its experimental `TerrainExtension` can drape layers on that surface in the GPU. That is the preferred future single-renderer architecture if the split boundary proves unstable, but it also needs a deliberate street-texture strategy. It should replace MapLibre terrain rather than coexist with it.
