# Demo fixture

This directory is Walking Ocho's milestone-zero test surface.

## Files

- `demo-walk.gpx` is the source input. It contains timestamps and elevation data and requires no network access.
- `demo-replay.json` is the expected replay-shaped output. It contains route geometry, samples, deterministic statistics, events, and hand-authored demo commentary.

The route is fictionalized and uses coordinates in San Francisco's Golden Gate Park area only to make the map visually useful. Names and commentary do not claim live or externally verified geographic facts.

## Contract

Consumers should treat `demo-replay.json` as the initial UI contract:

- route progress is normalized from `0` to `1`;
- all distances and elevations use metric base units;
- coordinates use GeoJSON order: longitude, latitude;
- commentary is joined to events through `eventId`;
- facts in commentary are backed by values present in the fixture;
- `source: "fixture"` distinguishes hand-authored copy from future model output.

## Milestone-zero acceptance criteria

- A developer can load a complete replay without a key, database, or external API.
- The payload can drive a route line, moving marker, metric cards, elevation profile, commentary feed, and highlight navigation.
- Commentary timing is deterministic.
- Opening or replaying this payload can never trigger an OpenAI request.

## Product gate

Do not add OpenAI integration until the app can render this fixture, play/pause it, scrub it, change replay speed, and jump between highlights.
