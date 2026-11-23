import { describe, expect, it } from "vitest";
import { BY_STATUS } from "../../shared/core";
import { createBoardStore, editSessions, setCollapse, setDef, setExpanded, setFocus, setSessions, setView } from "../../client/state/store";

const ready = (store: ReturnType<typeof createBoardStore>) => {
  setDef(store, { value: BY_STATUS, ready: true, ok: true });
  setSessions(store, { value: { version: 1, colors: {}, collapsed: {} }, ready: true, ok: true });
};

describe("store: persisted slice", () => {
  it("refuses edits before the host has answered", () => {
    const store = createBoardStore();
    setView(store, { fontScale: 1.2 });
    editSessions(store, (x) => ({ ...x, colors: { a: "red" } }));
    expect(store.get().persisted.def.value.view.fontScale).toBe(1);
    expect(store.get().persisted.sessions.value.colors).toEqual({});
  });
  it("refuses edits to a record that fell back, so the stored original is not overwritten (invariant 8)", () => {
    const store = createBoardStore();
    setSessions(store, { value: { version: 1, colors: {}, collapsed: {} }, ready: true, ok: false, original: { version: 9 } });
    setCollapse(store, "a", { state: "done", activity: 1 });
    expect(store.get().persisted.sessions.value.collapsed).toEqual({});
    expect(store.get().persisted.sessions.original).toEqual({ version: 9 });
  });
  it("edits the view and keeps unrelated fields", () => {
    const store = createBoardStore();
    ready(store);
    setView(store, { columnWidth: 420 });
    expect(store.get().persisted.def.value.view).toEqual({ columnWidth: 420, fontScale: 1 });
    expect(store.get().persisted.def.value.columns).toBe(BY_STATUS.columns);
  });
  it("does not notify when an edit changes nothing", () => {
    const store = createBoardStore();
    ready(store);
    let calls = 0;
    store.subscribe(() => calls++);
    setView(store, { columnWidth: 360 });
    setCollapse(store, "a", null);
    expect(calls).toBe(0);
  });
  it("sets and clears a hand-collapse, keyed by session", () => {
    const store = createBoardStore();
    ready(store);
    setCollapse(store, "a", { state: "done", activity: 5 });
    expect(store.get().persisted.sessions.value.collapsed).toEqual({ a: { state: "done", activity: 5 } });
    setCollapse(store, "a", null);
    expect(store.get().persisted.sessions.value.collapsed).toEqual({});
  });
});

describe("store: ephemeral slice", () => {
  it("tracks focus and hand-expanded cards", () => {
    const store = createBoardStore();
    setFocus(store, "a");
    setExpanded(store, "a", true);
    setExpanded(store, "b", true);
    setExpanded(store, "a", false);
    expect(store.get().ephemeral.focus).toBe("a");
    expect([...store.get().ephemeral.expanded]).toEqual(["b"]);
  });
  it("does not notify for a repeated value", () => {
    const store = createBoardStore();
    setFocus(store, "a");
    let calls = 0;
    store.subscribe(() => calls++);
    setFocus(store, "a");
    setExpanded(store, "x", false);
    expect(calls).toBe(0);
  });
  it("is independent per store (nothing in module scope)", () => {
    const one = createBoardStore();
    const two = createBoardStore();
    setFocus(one, "a");
    expect(two.get().ephemeral.focus).toBeNull();
  });
});
