// The "board sessions" record: per host, shared by every client (docs/board-definition.md, Storage).
import { z } from "zod";
import type { Collapse } from "./types";
import { CARD_STATES } from "./types";

export type BoardSessions = {
  version: 1;
  /** Session id to color id. */
  colors: Record<string, string>;
  /** Hand-collapsed cards by session id (invariant 10: never keyed by a user-defined name). */
  collapsed: Record<string, Collapse>;
};

export const EMPTY_SESSIONS: BoardSessions = { version: 1, colors: {}, collapsed: {} };

const sessionsSchema = z.object({
  version: z.literal(1),
  colors: z.record(z.string(), z.string()),
  collapsed: z.record(z.string(), z.object({ state: z.enum(CARD_STATES), activity: z.number() })),
});

export type ParsedSessions = { value: BoardSessions; ok: true } | { value: BoardSessions; ok: false; original: unknown };

/** Pure upgrade from older versions. Only v1 exists; a newer version fails the schema. */
export function migrateSessions(raw: unknown): unknown {
  return raw;
}

const isEmptyObject = (x: unknown) => typeof x === "object" && x !== null && !Array.isArray(x) && Object.keys(x).length === 0;

/** Nothing stored is the empty record. Invalid or newer-version input falls back and keeps the original. */
export function parseSessions(raw: unknown): ParsedSessions {
  if (raw === undefined || raw === null || isEmptyObject(raw)) return { value: EMPTY_SESSIONS, ok: true };
  const parsed = sessionsSchema.safeParse(migrateSessions(raw));
  return parsed.success ? { value: parsed.data as BoardSessions, ok: true } : { value: EMPTY_SESSIONS, ok: false, original: raw };
}

/**
 * Three-way merge of a keyed record: start from what the host holds now, then apply only what this
 * client changed since it last read (`base`). Used when a save finds the host moved on.
 */
export function mergeRecord<V>(
  base: Readonly<Record<string, V>>,
  mine: Readonly<Record<string, V>>,
  latest: Readonly<Record<string, V>>,
): Record<string, V> {
  const out: Record<string, V> = { ...latest };
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  for (const [k, v] of Object.entries(mine)) if (!(k in base) || !same(base[k], v)) out[k] = v;
  for (const k of Object.keys(base)) if (!(k in mine)) delete out[k];
  return out;
}

export function mergeSessions(base: BoardSessions, mine: BoardSessions, latest: BoardSessions): BoardSessions {
  return {
    version: 1,
    colors: mergeRecord(base.colors, mine.colors, latest.colors),
    collapsed: mergeRecord(base.collapsed, mine.collapsed, latest.collapsed),
  };
}
