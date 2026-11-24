import { describe, expect, it } from "vitest";
import type { CardState, LayoutColumn } from "../../shared/core";
import { columnCounts } from "../../client/ui/features/column-view";
import { place } from "../../client/ui/molecules/popover-math";

const column = (sections: { id: string; ids: string[] }[]): LayoutColumn => ({
  id: "c",
  title: "C",
  generated: false,
  folded: false,
  count: sections.reduce((n, s) => n + s.ids.length, 0),
  sections: sections.map((s) => ({ id: s.id, cards: s.ids.map((id) => ({ id, expanded: false })) })),
});
const states: Record<string, CardState> = { a: "needs", b: "needs", c: "running", d: "done", e: "failed", f: "permission" };

describe("columnCounts", () => {
  it("a column with groups counts each waiting or running state, loudest first, and skips done", () => {
    const c = column([{ id: "needs", ids: ["a", "b", "d", "e"] }, { id: "running", ids: ["c", "f"] }]);
    expect(columnCounts(c, states)).toEqual({
      kind: "states",
      counts: [
        { state: "failed", count: 1 },
        { state: "permission", count: 1 },
        { state: "needs", count: 2 },
        { state: "running", count: 1 },
      ],
    });
  });
  it("a column without groups shows its total, done included", () => {
    expect(columnCounts(column([{ id: "", ids: ["a", "d"] }]), states)).toEqual({ kind: "total", total: 2 });
  });
  it("an empty grouped column counts nothing", () => {
    expect(columnCounts(column([{ id: "needs", ids: [] }, { id: "running", ids: [] }]), states)).toEqual({ kind: "states", counts: [] });
  });
});

describe("popover placement", () => {
  const win = { width: 1000, height: 800 };
  const panel = { width: 200, height: 100 };
  it("hangs under the button with right edges level", () => {
    expect(place({ x: 500, y: 100, w: 26, h: 24 }, panel, win)).toEqual({ left: 326, top: 128 });
  });
  it("stays inside the window at the left and right edges", () => {
    expect(place({ x: 0, y: 100, w: 26, h: 24 }, panel, win).left).toBe(8);
    expect(place({ x: 990, y: 100, w: 26, h: 24 }, panel, win).left).toBe(792);
  });
  it("flips above when there is no room below", () => {
    expect(place({ x: 500, y: 760, w: 26, h: 24 }, panel, win).top).toBe(656);
  });
});
