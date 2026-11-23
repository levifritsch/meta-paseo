import { workspaceColumnId, type BoardDef, type BoardState, type Rule, type Snapshot } from "./types";

/** Reconcile per-workspace state with the live list. Never prunes before a successful load. */
export function reconcile(state: BoardState, ws: Snapshot["workspaces"]): BoardState {
  if (!ws.loaded) return state;
  const live = new Set(ws.list.map((w) => w.id));
  const kept = state.workspaceOrder.filter((id) => live.has(id));
  const added = ws.list.map((w) => w.id).filter((id) => !kept.includes(id));
  const folded = Object.fromEntries(
    Object.entries(state.folded).filter(([key]) => !key.startsWith("ws:") || live.has(key.slice(3))),
  );
  return { folded, workspaceOrder: [...kept, ...added] };
}

export type ResolvedColumn = {
  id: string;
  title: string;
  generated: boolean;
  match: Rule;
  sections?: string[];
};

/** Expand generator slots into one column per workspace, in saved order. */
export function resolveColumns(def: BoardDef, state: BoardState, ws: Snapshot["workspaces"]): ResolvedColumn[] {
  const names = new Map(ws.list.map((w) => [w.id, w.name]));
  return def.columns.flatMap((col): ResolvedColumn[] => {
    if (col.kind === "rule") {
      return [{ id: col.id, title: col.title, generated: false, match: col.match, sections: col.sections }];
    }
    return state.workspaceOrder.map((id) => ({
      id: workspaceColumnId(id),
      title: names.get(id) ?? id,
      generated: true,
      match: { workspace: id },
      sections: col.sections,
    }));
  });
}
