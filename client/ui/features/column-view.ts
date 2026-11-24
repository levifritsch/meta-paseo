// Pure: what a column header counts. No React.
import type { CardState, LayoutColumn } from "../../../shared/core";

/** Loudest first (failure > permission > question, Q4), then running. `done` is never counted: it is not waiting. */
export const COUNTED: readonly CardState[] = ["failed", "permission", "needs", "running"];

export type ColumnCounts =
  /** A column with groups: one badge per counted state. */
  | { kind: "states"; counts: { state: CardState; count: number }[] }
  /** A column without: the one total. */
  | { kind: "total"; total: number };

export function columnCounts(column: LayoutColumn, states: Readonly<Record<string, CardState>>): ColumnCounts {
  const grouped = column.sections.length > 1 || column.sections.some((s) => s.id !== "");
  if (!grouped) return { kind: "total", total: column.count };
  const tally = new Map<CardState, number>();
  for (const s of column.sections)
    for (const c of s.cards) {
      const st = states[c.id];
      if (st) tally.set(st, (tally.get(st) ?? 0) + 1);
    }
  return { kind: "states", counts: COUNTED.map((state) => ({ state, count: tally.get(state) ?? 0 })).filter((c) => c.count > 0) };
}
