# Route analysis

Walking Ocho separates input parsing from route truth. `importGpxRoute(xml)` and the WalkingLab adapter both produce `NormalizedRoute`; `analyzeRoute(route)` is deterministic and has no React, network, storage, or commentary dependency.

## Contract and units

- Coordinates are `[longitude, latitude]` in WGS84.
- Distances, elevations, and elapsed times use meters and seconds.
- Progress is cumulative route distance normalized to `0...1`.
- Segment boundaries contribute no invented connecting distance, grade, elevation gain/loss, or climb/descent trend.
- Missing time/elevation remains `null`; analysis does not substitute zero.
- The output and stable event IDs are versioned as analysis version 1.

GPX metadata is intentionally discarded. The adapter reads track segments, latitude, longitude, optional elevation, and optional ISO timestamps. TCX uses the same normalized boundary: only trackpoints containing a position are retained, sensor-only points and sensor metadata are discarded, timestamps become relative elapsed seconds, and absolute workout identifiers/times are not retained. Invalid positioned points become import issues; a document without any valid positioned track point is rejected.

## Algorithms

Distance uses the haversine formula with mean Earth radius 6,371,008.8 m. Per-sample speed is distance divided by positive elapsed time. Speeds above 12 m/s are flagged as GPS jumps and excluded from the fastest-section candidate. A gap over 120 seconds is marked sparse; positions less than 0.75 m apart are marked duplicates.

Elevation uses a centered five-sample median within each segment. This suppresses isolated altitude spikes while retaining sustained changes. Gain/loss accumulates consecutive smoothed changes of at least 1 m. Grade is rise/run over each retained interval of at least 5 m and is capped at ±35% to keep an outlier from becoming a product fact. An isolated raw change above 25 m over less than 50 m is flagged as an elevation spike.

Climb/descent events require a monotonic smoothed trend covering at least 100 m horizontally and 8 m vertically. The longest climb is the horizontal span of the longest rising run under the same smoothed series.

Events include start, finish, halfway, distance milestones, elevation extrema, sustained climbs/descents, fastest valid section, and one aggregate quality event. Nearby lower-importance events within 1.5% route progress are suppressed. Short routes are capped at 25 events, normal routes at 40, and unusually long routes at 60. IDs are assigned only after deterministic ordering and suppression.

## Tradeoffs and limitations

This is intentionally defensible walking analysis, not a GIS or physiology system. Haversine segments slightly understate curving paths between sparse samples. Median elevation smoothing depends on sample density. Duration currently represents elapsed rather than stopped-time classification, so `movingTimeSeconds` equals duration. GPX routes (`rtept`) and waypoints are outside V1; only tracks (`trkseg`/`trkpt`) are accepted. The dependency-free GPX adapter supports ordinary GPX 1.0/1.1 XML and namespace prefixes, but it is not a general XML validator.

Quality flags remain visible to downstream systems so UI and commentary can avoid overstating uncertain facts.
