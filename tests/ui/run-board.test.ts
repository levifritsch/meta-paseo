import { describe, expect, it } from "vitest";
import { BY_STATUS, BY_WORKSPACE, EMPTY_SESSIONS, groupingOf, withGrouping, type Card } from "../../shared/core";
import { runBoard } from "../../client/state/run-board";
import { commitBoardState, createBoardStore, setDef, setFolded, setGrouping } from "../../client/state/store";

const card = (id: string, over: Partial<Card> = {}): Card => ({ id, state: "done", workspace: "w1", title: id, lastActivity: 1, ...over });
const data = (cards: Card[]) => ({ cards, workspaces: { loaded: true, list: [{ id: "w1", name: "main" }] }, now: 100 });
const ids = (r: ReturnType<typeof runBoard>, col: string) => r.layout.columns.find((c) => c.id === col)!.sections.flatMap((s) => s.cards.map((c) => c.id));

describe("runBoard", () => {
  it("places cards by status", () => {
    const r = runBoard(BY_STATUS, null, data([card("a"), card("b", { state: "running" })]), EMPTY_SESSIONS, new Set());
    expect(ids(r, "done")).toEqual(["a"]);
    expect(ids(r, "running")).toEqual(["b"]);
  });
  it("a hand-collapsed card is compact, and a hand-expanded running card is expanded", () => {
    const sessions = { ...EMPTY_SESSIONS, collapsed: { a: { state: "done" as const, activity: 1 } } };
    const r = runBoard(BY_STATUS, null, data([card("a"), card("b", { state: "running" })]), sessions, new Set(["b"]));
    const open = (id: string, col: string) => r.layout.columns.find((c) => c.id === col)!.sections[0]!.cards.find((c) => c.id === id)!.expanded;
    expect(open("a", "done")).toBe(false);
    expect(open("b", "running")).toBe(true);
  });
  it("feeds the stored color to the color sort", () => {
    const def = { ...BY_STATUS, sort: [{ by: "color" as const, dir: "asc" as const }] };
    const sessions = { ...EMPTY_SESSIONS, colors: { a: "teal", b: "amber" } };
    expect(ids(runBoard(def, null, data([card("a"), card("b")]), sessions, new Set()), "done")).toEqual(["b", "a"]);
  });
});

describe("grouping", () => {
  it("names the built-in views and calls an edited one custom", () => {
    expect(groupingOf(BY_WORKSPACE)).toBe("workspace");
    expect(groupingOf(BY_STATUS)).toBe("status");
    expect(groupingOf({ ...BY_STATUS, sort: [{ by: "title", dir: "asc" }] })).toBe("custom");
  });
  it("switching keeps per-client state and view", () => {
    const def = { ...BY_WORKSPACE, state: { folded: { "ws:w1": true }, workspaceOrder: ["w1"] }, view: { columnWidth: 500, fontScale: 1.2 } };
    const next = withGrouping(def, "status");
    expect(groupingOf(next)).toBe("status");
    expect(next.state).toBe(def.state);
    expect(next.view).toBe(def.view);
    expect(withGrouping(def, "workspace")).toBe(def);
  });
});

describe("store: board layout actions", () => {
  const ready = () => {
    const store = createBoardStore();
    setDef(store, { value: BY_WORKSPACE, ready: true, ok: true });
    return store;
  };
  it("setGrouping and setFolded edit the definition", () => {
    const store = ready();
    setGrouping(store, "status");
    expect(groupingOf(store.get().persisted.def.value)).toBe("status");
    setFolded(store, "done", true);
    expect(store.get().persisted.def.value.state.folded).toEqual({ done: true });
  });
  it("commitBoardState saves a changed state and ignores an equal one", () => {
    const store = ready();
    commitBoardState(store, { folded: {}, workspaceOrder: ["w1"] });
    const saved = store.get();
    expect(saved.persisted.def.value.state.workspaceOrder).toEqual(["w1"]);
    commitBoardState(store, { folded: {}, workspaceOrder: ["w1"] });
    expect(store.get()).toBe(saved);
  });
  it("a read-only definition refuses layout edits", () => {
    const store = createBoardStore();
    setDef(store, { value: BY_WORKSPACE, ready: true, ok: false, original: { version: 9 } });
    setGrouping(store, "status");
    expect(groupingOf(store.get().persisted.def.value)).toBe("workspace");
  });
});
