import { describe, expect, it } from "vitest";
import { importTcxRoute, TcxImportError } from "./tcx";

const header = `<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"><Activities><Activity Sport="Other"><Lap><Track>`;
const footer = `</Track></Lap></Activity></Activities></TrainingCenterDatabase>`;

describe("importTcxRoute", () => {
  it("imports positioned points as longitude/latitude with relative time and elevation", () => {
    const route = importTcxRoute(`${header}
      <Trackpoint><Time>2020-01-01T00:00:00Z</Time><Position><LatitudeDegrees>37.1</LatitudeDegrees><LongitudeDegrees>-122.2</LongitudeDegrees></Position><AltitudeMeters>12.5</AltitudeMeters></Trackpoint>
      <Trackpoint><Time>2020-01-01T00:00:10Z</Time><Position><LatitudeDegrees>37.2</LatitudeDegrees><LongitudeDegrees>-122.3</LongitudeDegrees></Position><AltitudeMeters>13.5</AltitudeMeters></Trackpoint>
    ${footer}`);
    expect(route.source).toEqual({ kind: "tcx", schemaVersion: 2 });
    expect(route.activityType).toBe("Other");
    expect(route.segments[0].samples[0]).toMatchObject({ coordinates: [-122.2, 37.1], elapsedSeconds: 0, elevationMeters: 12.5 });
    expect(route.segments[0].samples[1].elapsedSeconds).toBe(10);
    expect(route.durationSeconds).toBe(10);
  });

  it("ignores sensor-only trackpoints and preserves missing optional altitude", () => {
    const route = importTcxRoute(`${header}
      <Trackpoint><Time>2020-01-01T00:00:00Z</Time><HeartRateBpm><Value>80</Value></HeartRateBpm></Trackpoint>
      <Trackpoint><Time>2020-01-01T00:00:10Z</Time><Position><LatitudeDegrees>1</LatitudeDegrees><LongitudeDegrees>2</LongitudeDegrees></Position></Trackpoint>
    ${footer}`);
    expect(route.segments[0].samples).toHaveLength(1);
    expect(route.segments[0].samples[0].elevationMeters).toBeNull();
  });

  it("rejects malformed and unusable TCX documents", () => {
    expect(() => importTcxRoute("not xml")).toThrow(TcxImportError);
    expect(() => importTcxRoute("<TrainingCenterDatabase></TrainingCenterDatabase>")).toThrow("no tracks");
    expect(() => importTcxRoute(`${header}<Trackpoint><Time>2020-01-01T00:00:00Z</Time></Trackpoint>${footer}`)).toThrow("no valid positioned");
  });
});
