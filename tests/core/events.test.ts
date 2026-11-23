import { describe, expect, it } from "vitest";
import { BY_STATUS, BY_WORKSPACE, board } from "../../src/core";
import { card, snap } from "./helpers";

describe("shake events", () => {
  it("does not shake on first load (E2)", () => {
    expect(board(BY_STATUS, null, snap([card("a", { state: "needs" })])).events).toEqual([]);
  });
  it("shakes a column when a card there comes to need you (E1)", () => {
    const first = board(BY_STATUS, null, snap([card("a")]));
    const next = board(BY_STATUS, first.layout, snap([card("a", { state: "needs" })]));
    expect(next.events).toEqual([{ type: "shake", columnId: "needs" }]);
  });
  it("shakes the receiving column when a card moves into it", () => {
    const first = board(BY_STATUS, null, snap([card("a", { state: "needs" })]));
    const next = board(BY_STATUS, first.layout, snap([card("a", { state: "done" })]));
    expect(next.events).toEqual([{ type: "shake", columnId: "done" }]);
  });
  it("does not shake when nothing changed", () => {
    const first = board(BY_STATUS, null, snap([card("a", { state: "needs" })]));
    expect(board(BY_STATUS, first.layout, snap([card("a", { state: "needs" })])).events).toEqual([]);
  });
  it("does not shake when the grouping changes (E2)", () => {
    const first = board(BY_STATUS, null, snap([card("a", { state: "needs" })]));
    expect(board(BY_WORKSPACE, first.layout, snap([card("a", { state: "needs" })])).events).toEqual([]);
  });
});
