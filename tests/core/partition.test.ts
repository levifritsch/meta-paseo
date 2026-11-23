import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { partition } from "../../src/core";
import type { BoardDef, Card, CardState } from "../../src/core";

const STATES: CardState[] = ["needs", "permission", "running", "idle", "failed"];
const def: BoardDef = {
  version: 1,
  columns: [
    { kind: "rule", id: "needs", title: "Needs you", match: { any: [{ state: "needs" }, { state: "permission" }] } },
    { kind: "rule", id: "running", title: "Running", match: { state: "running" } },
  ],
};
const cardArb = fc.record({
  id: fc.uuid(),
  state: fc.constantFrom(...STATES),
  workspace: fc.constantFrom("a", "b"),
  title: fc.string(),
  lastActivity: fc.nat(),
});

describe("partition", () => {
  it("sends unmatched cards to a trailing Other", () => {
    const card: Card = { id: "1", state: "idle", workspace: "a", title: "", lastActivity: 0 };
    expect(partition(def, [card]).columns.at(-1)).toMatchObject({ id: "other", cardIds: ["1"] });
  });

  it("hides Other when empty", () => {
    const card: Card = { id: "1", state: "running", workspace: "a", title: "", lastActivity: 0 };
    expect(partition(def, [card]).columns.map((c) => c.id)).toEqual(["needs", "running"]);
  });

  it("invariant 1: every card is in exactly one column", () => {
    fc.assert(
      fc.property(fc.uniqueArray(cardArb, { selector: (c) => c.id }), (cards) => {
        const placed = partition(def, cards).columns.flatMap((c) => c.cardIds);
        expect([...placed].sort()).toEqual(cards.map((c) => c.id).sort());
      }),
    );
  });
});
