import { describe, expect, it } from "vitest";
import { BY_STATUS, BY_WORKSPACE, board } from "../../shared/core";
import { card, colIds, ids, snap } from "./helpers";

const cards = [
  card("q", { state: "needs", workspace: "w1", lastActivity: 5 }),
  card("f", { state: "failed", workspace: "w2", lastActivity: 6 }),
  card("d", { state: "done", workspace: "w1", lastActivity: 7 }),
  card("p", { state: "permission", workspace: "w1", lastActivity: 1 }),
  card("r", { state: "running", workspace: "w2", lastActivity: 9 }),
];

describe("preset: by workspace", () => {
  const { layout } = board(BY_WORKSPACE, null, snap(cards));
  it("makes one column per workspace, in list order", () => {
    expect(colIds({ layout } as never)).toEqual(["ws:w1", "ws:w2"]);
  });
  it("puts needs-you cards above running and permission cards (K1)", () => {
    expect(ids(layout, "ws:w1", "needs")).toEqual(["d", "q"]);
    expect(ids(layout, "ws:w1", "running")).toEqual(["p"]);
    expect(ids(layout, "ws:w2", "needs")).toEqual(["f"]);
    expect(ids(layout, "ws:w2", "running")).toEqual(["r"]);
  });
});

describe("preset: by status", () => {
  const { layout } = board(BY_STATUS, null, snap(cards));
  it("makes Needs you, Done, Running (K2)", () => {
    expect(colIds({ layout } as never)).toEqual(["needs", "done", "running"]);
    expect(ids(layout, "needs")).toEqual(["f", "q"]);
    expect(ids(layout, "done")).toEqual(["d"]);
  });
  it("sorts permission to the top of Running", () => {
    expect(ids(layout, "running")).toEqual(["p", "r"]);
  });
  it("shows one count per column (K3)", () => {
    expect(layout.columns.map((c) => c.count)).toEqual([2, 1, 2]);
  });
});

describe("workspace columns", () => {
  it("folds empty workspaces by default (K1)", () => {
    const { layout } = board(BY_WORKSPACE, null, snap([card("a")]));
    expect(layout.columns.map((c) => c.folded)).toEqual([false, true]);
  });
  it("sends cards of unknown workspaces to a trailing Other, hidden when empty (K4)", () => {
    const withOther = board(BY_WORKSPACE, null, snap([card("a", { workspace: "zzz" })]));
    expect(colIds(withOther)).toEqual(["ws:w1", "ws:w2", "other"]);
    expect(colIds(board(BY_WORKSPACE, null, snap([card("a")])))).toEqual(["ws:w1", "ws:w2"]);
  });
  it("keeps user order, appends new workspaces, and prunes archived ones", () => {
    const def = { ...BY_WORKSPACE, state: { folded: { "ws:gone": true, keep: true }, workspaceOrder: ["w2", "gone", "w1"] } };
    const r = board(def, null, snap([]));
    expect(r.state.workspaceOrder).toEqual(["w2", "w1"]);
    expect(r.state.folded).toEqual({ keep: true });
  });
  it("never prunes before a successful load (invariant 9)", () => {
    const def = { ...BY_WORKSPACE, state: { folded: { "ws:w1": true }, workspaceOrder: ["w1", "w2"] } };
    const r = board(def, null, snap([], { workspaces: { loaded: false, list: [] } }));
    expect(r.state).toEqual(def.state);
    expect(colIds(r)).toEqual(["ws:w1", "ws:w2"]);
  });
});
