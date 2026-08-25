# Commentary engine

The commentary engine is a server-only boundary that turns deterministic route facts and selected events into one validated broadcast package. It does not calculate route facts and cannot accept raw samples, coordinates, geometry, GPX, timestamps, or device metadata.

## Data flow

1. Route analysis produces condensed `CommentaryRouteFacts` and `CommentaryEventFact[]` values.
2. `generateAndStoreCommentary` first checks the store, so an existing package is reused.
3. The OpenAI adapter makes at most two attempts using one structured Responses API request per attempt.
4. Runtime validation rejects unknown event IDs, invalid speakers, duplicate event lines, excessive text, and invalid importance values.
5. The validated package is saved through `CommentaryStore`.
6. Public replay code calls only `loadStoredCommentary`; that function has no generator or OpenAI dependency.

Missing event lines are allowed so one weak model line cannot prevent a route from being published. The opening and finish recap remain required. UI integration should fall back to deterministic event labels when a line is absent.

## Privacy boundary

The request body is built by explicitly projecting the allowlisted scalar facts and events. Do not replace that projection with object spreading. Coordinates are excluded even from selected events. Tests add hostile `samples` and `geometry` properties at runtime and assert that their names and sentinel values do not appear in the serialized request.

## Configuration

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` only when a live generation flow is intentionally enabled. `OPENAI_COMMENTARY_MODEL` defaults to `gpt-5-mini`. Both variables are server-only; never use a `NEXT_PUBLIC_` prefix.

No live API call is part of the test suite. Tests inject a mocked `fetch` implementation. Usage token counts are exposed to an injected logger when the API returns them; the logger must not record prompts or route content.

## Integration adapter

Route analysis should construct `CommentaryGenerationInput` from its finalized summary and event stream. This narrow adapter belongs at the analysis/integration boundary. The commentary module deliberately does not import `NormalizedRoute`, replay samples, or GeoJSON types.

The eventual persistence implementation needs only:

```ts
interface CommentaryStore {
  save(routeId: string, commentary: CommentaryPackage): Promise<void>;
  load(routeId: string): Promise<CommentaryPackage | null>;
}
```

This keeps file-based replay storage viable and avoids committing to a database.
