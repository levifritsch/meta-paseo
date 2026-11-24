import { describe, expect, it } from "vitest";
import { BY_STATUS, board } from "../../shared/core";
import { card, ids, snap } from "./helpers";

const col = (r: ReturnType<typeof board>, id = "done") => ids(r.layout, id);

describe("size", () => {
  it("opens needs, done and failed expanded; running compact (S1)", () => {
    const r = board(BY_STATUS, null, snap([card("d", { state: "done" }), card("r")]));
    const flat = r.layout.columns.flatMap((c) => c.sections.flatMap((s) => s.cards));
    expect(flat.find((c) => c.id === "d")?.expanded).toBe(true);
    expect(flat.find((c) => c.id === "r")?.expanded).toBe(false);
  });
  it("always expands a permission card, even if hand-collapsed (S2)", () => {
    const p = card("p", { state: "permission" });
    const r = board(BY_STATUS, null, snap([p], { collapsed: { p: { state: "permission", activity: 100 } } }));
    expect(r.layout.columns[2]!.sections[0]!.cards[0]!.expanded).toBe(true);
  });
  it("keeps a hand-expanded running card expanded when it asks for permission (S3)", () => {
    const s = snap([card("a", { state: "permission" })], { expanded: new Set(["a"]) });
    expect(board(BY_STATUS, null, s).layout.columns[2]!.sections[0]!.cards[0]!.expanded).toBe(true);
  });
});

describe("order", () => {
  it("puts expanded before compact (S4)", () => {
    const r = board(BY_STATUS, null, snap([card("r", { lastActivity: 9 }), card("p", { state: "permission", lastActivity: 1 })]));
    expect(col(r, "running")).toEqual(["p", "r"]);
  });
  it("sends a card you expand to the bottom of the expanded stack (S5)", () => {
    const a = card("a", { state: "permission", lastActivity: 3 });
    const b = card("b", { state: "permission", lastActivity: 2 });
    const c = card("c", { lastActivity: 1 });
    const first = board(BY_STATUS, null, snap([a, b, c]));
    expect(col(first, "running")).toEqual(["a", "b", "c"]);
    const second = board(BY_STATUS, first.layout, snap([a, b, c], { expanded: new Set(["c"]) }));
    expect(col(second, "running")).toEqual(["a", "b", "c"]);
    const d = card("d", { lastActivity: 99 });
    const third = board(BY_STATUS, second.layout, snap([a, b, c, d], { expanded: new Set(["c", "d"]) }));
    expect(col(third, "running")).toEqual(["a", "b", "c", "d"]);
  });
  it("sends a card you collapse to the top of the compact stack (S5)", () => {
    const x = card("x", { state: "done", lastActivity: 3 });
    const y = card("y", { state: "done", lastActivity: 2 });
    const z = card("z", { state: "done", lastActivity: 1 });
    const first = board(BY_STATUS, null, snap([x, y, z]));
    const y1 = { y: { state: "done" as const, activity: 2 } };
    const second = board(BY_STATUS, first.layout, snap([x, y, z], { collapsed: y1 }));
    expect(col(second)).toEqual(["x", "z", "y"]);
    const third = board(BY_STATUS, second.layout, snap([x, y, z], { collapsed: { ...y1, z: { state: "done", activity: 1 } } }));
    expect(col(third)).toEqual(["x", "z", "y"]);
    const fourth = board(BY_STATUS, third.layout, snap([x, y, z], { collapsed: { ...y1, z: { state: "done", activity: 1 }, x: { state: "done", activity: 3 } } }));
    expect(col(fourth)).toEqual(["x", "z", "y"]);
  });
  it("lets a joining card land below the expanded cards already there (S6)", () => {
    const old = card("old", { state: "done", lastActivity: 1 });
    const first = board(BY_STATUS, null, snap([old]));
    const joiner = card("new", { state: "done", lastActivity: 50 });
    expect(col(board(BY_STATUS, first.layout, snap([old, joiner])))).toEqual(["old", "new"]);
  });
  it("keeps existing cards in place when activity changes", () => {
    const a = card("a", { state: "done", lastActivity: 1 });
    const b = card("b", { state: "done", lastActivity: 2 });
    const first = board(BY_STATUS, null, snap([a, b]));
    expect(col(first)).toEqual(["b", "a"]);
    const again = board(BY_STATUS, first.layout, snap([{ ...a, lastActivity: 500 }, b]));
    expect(col(again)).toEqual(["b", "a"]);
  });
});

describe("collapse memory", () => {
  const d = card("d", { state: "done", lastActivity: 10 });
  const collapsed = { d: { state: "done" as const, activity: 10 } };
  it("keeps a hand-collapsed card compact while in the same state (M1)", () => {
    const r = board(BY_STATUS, null, snap([d], { collapsed }));
    expect(r.layout.columns[1]!.sections[0]!.cards[0]!.expanded).toBe(false);
  });
  it("reopens a finished card when it does something new (M2)", () => {
    const r = board(BY_STATUS, null, snap([{ ...d, lastActivity: 11 }], { collapsed }));
    expect(r.layout.columns[1]!.sections[0]!.cards[0]!.expanded).toBe(true);
  });
  it("drops a collapsed failed card below the expanded ones (M3)", () => {
    const f = card("f", { state: "failed", lastActivity: 10 });
    const g = card("g", { state: "failed", lastActivity: 1 });
    const r = board(BY_STATUS, null, snap([f, g], { collapsed: { f: { state: "failed", activity: 10 } } }));
    expect(col(r, "needs")).toEqual(["g", "f"]);
  });
});

describe("focus", () => {
  it("keeps a focused card's column and place when its state changes (F1, F2)", () => {
    const a = card("a", { state: "done" });
    const first = board(BY_STATUS, null, snap([a]));
    const moved = { ...a, state: "running" as const };
    const pinned = board(BY_STATUS, first.layout, snap([moved], { focus: "a" }));
    expect(col(pinned, "done")).toEqual(["a"]);
    expect(col(pinned, "running")).toEqual([]);
    const released = board(BY_STATUS, pinned.layout, snap([moved], { focus: null }));
    expect(col(released, "done")).toEqual([]);
    expect(col(released, "running")).toEqual(["a"]);
  });
  const sizeOf = (r: ReturnType<typeof board>, id: string) =>
    r.layout.columns.flatMap((c) => c.sections.flatMap((s) => s.cards)).find((c) => c.id === id)?.expanded;
  it("applies a hand collapse or expand at once, while the card still has focus (F4)", () => {
    const a = card("a", { state: "done" });
    const first = board(BY_STATUS, null, snap([a], { focus: "a" }));
    expect(sizeOf(first, "a")).toBe(true);
    const collapsed = board(BY_STATUS, first.layout, snap([a], { focus: "a", collapsed: { a: { state: "done", activity: a.lastActivity } } }));
    expect(sizeOf(collapsed, "a")).toBe(false);
    const reopened = board(BY_STATUS, collapsed.layout, snap([a], { focus: "a", expanded: new Set(["a"]) }));
    expect(sizeOf(reopened, "a")).toBe(true);
    const r = card("r");
    const compact = board(BY_STATUS, null, snap([r], { focus: "r" }));
    expect(sizeOf(compact, "r")).toBe(false);
    const opened = board(BY_STATUS, compact.layout, snap([r], { focus: "r", expanded: new Set(["r"]) }));
    expect(sizeOf(opened, "r")).toBe(true);
  });
  it("still pins size against an automatic change (F1)", () => {
    const r = card("r");
    const first = board(BY_STATUS, null, snap([r], { focus: "r" }));
    const done = { ...r, state: "done" as const };
    expect(sizeOf(board(BY_STATUS, first.layout, snap([done], { focus: "r" })), "r")).toBe(false);
  });
});
