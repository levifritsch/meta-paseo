import { z } from "zod";
import { DEFAULT_DEF } from "./presets";
import { CARD_STATES, type BoardDef, type Rule } from "./types";

const cardState = z.enum(CARD_STATES);
const rule: z.ZodType<Rule> = z.lazy(() =>
  z
    .object({
      state: cardState.optional(),
      workspace: z.string().optional(),
      project: z.string().optional(),
      model: z.string().optional(),
      hasSubAgents: z.boolean().optional(),
      idleOver: z.number().optional(),
      not: rule.optional(),
      any: z.array(rule).optional(),
    })
    .strict(),
);

const column = z.union([
  z.object({ kind: z.literal("rule"), id: z.string(), title: z.string(), match: rule, sections: z.array(z.string()).optional() }),
  z.object({ kind: z.literal("workspaces"), sections: z.array(z.string()).optional() }),
]);

const boardDef = z.object({
  version: z.literal(1),
  columns: z.array(column).refine(
    (cols) => {
      const ids = cols.flatMap((c) => (c.kind === "rule" ? [c.id] : []));
      return new Set(ids).size === ids.length && !ids.includes("other");
    },
    "column ids must be unique and not `other`",
  ),
  sections: z.array(z.object({ id: z.string(), label: z.string() })),
  buckets: z.partialRecord(cardState, z.string()),
  sort: z.array(z.object({ by: z.enum(["activity", "title", "color", "waitingSince"]), dir: z.enum(["asc", "desc"]) })),
  state: z.object({ folded: z.record(z.string(), z.boolean()), workspaceOrder: z.array(z.string()) }),
});

export type ParsedDef = { def: BoardDef; ok: true } | { def: BoardDef; ok: false; original: unknown };

/** Invalid or newer-version input falls back to the default and keeps the original (invariant 8). */
export function parseBoardDef(raw: unknown, fallback: BoardDef = DEFAULT_DEF): ParsedDef {
  const parsed = boardDef.safeParse(migrate(raw));
  return parsed.success ? { def: parsed.data as BoardDef, ok: true } : { def: fallback, ok: false, original: raw };
}

/** Pure upgrade from older versions. Only v1 exists; newer versions fail the schema. */
export function migrate(raw: unknown): unknown {
  return raw;
}
