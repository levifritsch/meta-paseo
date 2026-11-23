import type { BoardDef } from "./types";

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
};

export const DEFAULT_DEF = BY_WORKSPACE;
