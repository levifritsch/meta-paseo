import { DEFAULT_VIEW, type BoardDef } from "./types";

const empty = { folded: {}, workspaceOrder: [] };

/** One column per workspace; "Needs you" group above "Running". */
export const BY_WORKSPACE: BoardDef = {
  version: 1,
  columns: [{ kind: "workspaces", sections: ["needs", "running"] }],
  sections: [
    { id: "needs", label: "Needs you" },
    { id: "running", label: "Running" },
  ],
  buckets: { needs: "needs", failed: "needs", done: "needs", permission: "running", running: "running" },
  sort: [{ by: "activity", dir: "desc" }],
  state: empty,
  view: DEFAULT_VIEW,
};

/** One column per status across every workspace. */
export const BY_STATUS: BoardDef = {
  version: 1,
  columns: [
    { kind: "rule", id: "needs", title: "Needs you", match: { any: [{ state: "needs" }, { state: "failed" }] } },
    { kind: "rule", id: "done", title: "Done", match: { state: "done" } },
    { kind: "rule", id: "running", title: "Running", match: { any: [{ state: "running" }, { state: "permission" }] } },
  ],
  sections: [],
  buckets: {},
  sort: [{ by: "activity", dir: "desc" }],
  state: empty,
  view: DEFAULT_VIEW,
};

export const DEFAULT_DEF = BY_WORKSPACE;

export type Grouping = "workspace" | "status";
const PRESETS: Record<Grouping, BoardDef> = { workspace: BY_WORKSPACE, status: BY_STATUS };
const shape = (d: BoardDef) => JSON.stringify([d.columns, d.sections, d.buckets, d.sort]);

/** Which built-in view a definition is, or `custom` once the user has edited its rules. */
export function groupingOf(def: BoardDef): Grouping | "custom" {
  return (Object.keys(PRESETS) as Grouping[]).find((g) => shape(PRESETS[g]) === shape(def)) ?? "custom";
}

/** Switch to a built-in view. Per-client layout state and view options carry over. */
export function withGrouping(def: BoardDef, grouping: Grouping): BoardDef {
  return groupingOf(def) === grouping ? def : { ...PRESETS[grouping], state: def.state, view: def.view };
}
