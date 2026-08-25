import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateCommentary } from "./openai-adapter";
import { generateAndStoreCommentary, loadStoredCommentary } from "./service";
import type { CommentaryGenerationInput, CommentaryPackage, CommentaryStore } from "./types";

const input: CommentaryGenerationInput = {
  routeId: "route-1",
  facts: {
    name: "Test Loop",
    distanceMeters: 1200,
    durationSeconds: 900,
    elevationGainMeters: 30,
    averagePaceSecondsPerKilometer: 750,
    highestElevationMeters: 80,
    lowestElevationMeters: 50,
  },
  events: [
    {
      id: "start",
      type: "route_start",
      routeProgress: 0,
      distanceMeters: 0,
      elapsedSeconds: 0,
      metrics: { elevationMeters: 50 },
      importance: 3,
    },
    {
      id: "finish",
      type: "finish",
      routeProgress: 1,
      distanceMeters: 1200,
      elapsedSeconds: 900,
      metrics: { elevationGainMeters: 30 },
      importance: 3,
    },
  ],
};

function response(payload: unknown, status = 200) {
  return new Response(
    JSON.stringify({ output_text: JSON.stringify(payload), usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 } }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

const validPayload = {
  opening: "The walking is underway.",
  lines: [
    { eventId: "start", speaker: "play_by_play", text: "A decisive first step.", importance: 3 },
    { eventId: "finish", speaker: "color", text: "The pavement has been conquered.", importance: 3 },
  ],
  finishRecap: "A complete and verified walk.",
};

describe("generateCommentary", () => {
  it("sends condensed facts and events but excludes raw samples, coordinates, and route geometry", async () => {
    const fetcher = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return response(validPayload);
    });
    const hostileInput = {
      ...input,
      samples: [{ latitude: 12.34, longitude: 56.78, timestamp: "private" }],
      geometry: { coordinates: [[56.78, 12.34]] },
    } as CommentaryGenerationInput;

    await generateCommentary(hostileInput, { apiKey: "test-key", fetch: fetcher as typeof fetch });

    const request = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    const serialized = JSON.stringify(request);
    expect(serialized).not.toContain("samples");
    expect(serialized).not.toContain("coordinates");
    expect(serialized).not.toContain("12.34");
    expect(serialized).not.toContain("private");
    expect(serialized).toContain("distanceMeters");
    expect(serialized).toContain("route_start");
  });

  it("rejects schema-valid-looking output that references an unknown event", async () => {
    const payload = { ...validPayload, lines: [{ ...validPayload.lines[0], eventId: "invented" }] };
    await expect(
      generateCommentary(input, { apiKey: "test-key", maxAttempts: 1, fetch: async () => response(payload) }),
    ).rejects.toThrow("Unknown eventId");
  });

  it("accepts a bounded partial package when a nonessential event line is missing", async () => {
    const payload = { ...validPayload, lines: [validPayload.lines[1]] };
    const result = await generateCommentary(input, {
      apiKey: "test-key",
      fetch: async () => response(payload),
    });
    expect(result.package.lines).toHaveLength(1);
    expect(result.package.lines[0]?.eventId).toBe("finish");
  });

  it("retries once after malformed output", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ ...validPayload, opening: "" }))
      .mockResolvedValueOnce(response(validPayload));
    const result = await generateCommentary(input, { apiKey: "test-key", fetch: fetcher });
    expect(result.package.routeId).toBe("route-1");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe("commentary persistence seam", () => {
  it("loads a public replay without invoking generation", async () => {
    const stored = { schemaVersion: 1, routeId: "route-1", tone: "clean", ...validPayload } as CommentaryPackage;
    const store: CommentaryStore = { load: vi.fn(async () => stored), save: vi.fn(async () => undefined) };
    await expect(loadStoredCommentary("route-1", store)).resolves.toBe(stored);
    expect(store.load).toHaveBeenCalledOnce();
    expect(store.save).not.toHaveBeenCalled();
  });

  it("reuses an existing package without making a model request", async () => {
    const stored = {
      schemaVersion: 1,
      routeId: "route-1",
      tone: "mildly_irreverent",
      ...validPayload,
    } as CommentaryPackage;
    const store: CommentaryStore = { load: vi.fn(async () => stored), save: vi.fn(async () => undefined) };
    const fetcher = vi.fn<typeof fetch>();
    await expect(generateAndStoreCommentary(input, store, { apiKey: "test-key", fetch: fetcher })).resolves.toBe(stored);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
