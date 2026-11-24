// Pure: the board engine fed from the store's slices and the live data. No React.
import { board, type BoardDef, type BoardResult, type BoardSessions, type Card, type Layout, type Workspace } from "../../shared/core";

export type BoardInputs = {
  cards: readonly Card[];
  workspaces: { loaded: boolean; list: Workspace[] };
  now: number;
};

/** Cards get their stored color (the sort key `color` reads it); the rest of the snapshot comes from the store. */
export function runBoard(
  def: BoardDef,
  prev: Layout | null,
  data: BoardInputs,
  sessions: BoardSessions,
  focus: string | null,
  expanded: ReadonlySet<string>,
): BoardResult {
  return board(def, prev, {
    cards: data.cards.map((c) => ({ ...c, color: sessions.colors[c.id] ?? c.color })),
    workspaces: data.workspaces,
    focus,
    now: data.now,
    collapsed: sessions.collapsed,
    expanded,
  });
}
