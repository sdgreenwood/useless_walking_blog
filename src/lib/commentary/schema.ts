import {
  COMMENTARY_SPEAKERS,
  type CommentaryPackage,
  type CommentaryTone,
} from "./types";

export class CommentaryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommentaryValidationError";
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CommentaryValidationError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max = 320): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new CommentaryValidationError(`${label} must be 1-${max} characters`);
  }
  return value.trim();
}

export function parseCommentaryPackage(
  value: unknown,
  routeId: string,
  tone: CommentaryTone,
  validEventIds: ReadonlySet<string>,
): CommentaryPackage {
  const root = object(value, "commentary");
  if (!Array.isArray(root.lines)) {
    throw new CommentaryValidationError("commentary.lines must be an array");
  }

  const seen = new Set<string>();
  const lines = root.lines.map((raw, index) => {
    const line = object(raw, `lines[${index}]`);
    const eventId = text(line.eventId, `lines[${index}].eventId`, 100);
    if (!validEventIds.has(eventId)) {
      throw new CommentaryValidationError(`Unknown eventId: ${eventId}`);
    }
    if (seen.has(eventId)) {
      throw new CommentaryValidationError(`Duplicate eventId: ${eventId}`);
    }
    seen.add(eventId);
    if (!COMMENTARY_SPEAKERS.includes(line.speaker as never)) {
      throw new CommentaryValidationError(`Invalid speaker for ${eventId}`);
    }
    if (!Number.isInteger(line.importance) || Number(line.importance) < 1 || Number(line.importance) > 3) {
      throw new CommentaryValidationError(`Invalid importance for ${eventId}`);
    }
    return {
      eventId,
      speaker: line.speaker as CommentaryPackage["lines"][number]["speaker"],
      text: text(line.text, `lines[${index}].text`),
      importance: Number(line.importance),
    };
  });

  return {
    schemaVersion: 1,
    routeId,
    tone,
    opening: text(root.opening, "opening", 400),
    lines,
    finishRecap: text(root.finishRecap, "finishRecap", 500),
  };
}
