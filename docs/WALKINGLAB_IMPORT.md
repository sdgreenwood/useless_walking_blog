# WalkingLab private import boundary

Status: implemented schema-v1 adapter, 2026-08-24.

## Purpose

Walking Ocho may use a private WalkingLab route export as a normalized evidence source instead of decoding raw HealthKit data. `importWalkingLabRoute(input)` projects that source into the same framework-independent route domain that future GPX import and deterministic analysis will consume.

## Accepted evidence

For schema version 1 the importer reads route segments containing sequence, timestamp, latitude, longitude, optional altitude, and optional horizontal/vertical accuracy. It also reads the workout activity type and start/end only to derive duration.

## Privacy boundary

The returned model deliberately excludes:

- HealthKit workout and route UUIDs;
- update identities;
- device model and operating-system data;
- source names, versions, and bundle identifiers;
- export generation time and warning prose;
- absolute workout/sample timestamps.

Timestamps become seconds elapsed from the first available route timestamp. This projection does not itself make a route publishable: precise coordinates remain private until a later explicit trimming/redaction and review step.

## Validation and degradation

Unsupported schema versions and exports with no route entries are rejected. Invalid coordinates or required sample fields cause that sample to be omitted with a structured issue. Missing altitude or accuracy remains `null`; it is never converted to zero. Non-monotonic sequence/time evidence is retained and flagged so the deterministic analysis layer can make the final suppression decision.

Multiple WalkingLab routes remain distinct segments. This prevents the importer from inventing a connecting line between route fragments.

V1 analysis supports multiple segments without crossing their boundaries, but public replay generation deliberately refuses fragmented routes because the current map contract is one `LineString`. A future `MultiLineString` replay version may lift that restriction.

## Testing policy

Repository tests use only synthetic coordinates and identifiers. Personal WalkingLab exports must remain outside Git and may be used only for local compatibility checks that do not print coordinates, absolute times, UUIDs, or device metadata.
