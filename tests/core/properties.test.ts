import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BY_STATUS, BY_WORKSPACE, CARD_STATES, board, type BoardDef, type Card, type Layout } from "../../src/core";
import { snap } from "./helpers";

const cardsArb = fc.uniqueArray(
  fc.record({
    id: fc.uuid(),
    state: fc.constantFrom(...CARD_STATES),
    workspace: fc.constantFrom("w1", "w2", "w3"),
    title: fc.string(),
    lastActivity: fc.nat(1000),
  }),
  { selector: (c) => c.id },
);
const defArb = fc.constantFrom<BoardDef>(BY_WORKSPACE, BY_STATUS);

/** Two passes: a cold layout, then a re-run over mutated cards using the first as `prev`. */
const runs = fc.tuple(defArb, cardsArb, fc.array(fc.constantFrom(...CARD_STATES), { maxLength: 30 }), fc.nat(40));

function check(layout: Layout, cards: Card[]) {
  const all = layout.columns.flatMap((c) => c.sections.flatMap((s) => s.cards.map((p) => ({ p, sec: s }))));
  // Invariant 1: every card in exactly one column.
  expect(all.map((x) => x.p.id).sort()).toEqual(cards.map((c) => c.id).sort());
  const state = new Map(cards.map((c) => [c.id, c.state]));
  for (const col of layout.columns) {
    for (const sec of col.sections) {
      // Invariant 6: expanded precede compact within a section.
      const flags = sec.cards.map((c) => c.expanded);
      expect(flags).toEqual([...flags].sort((a, b) => Number(b) - Number(a)));
      // Invariant 2: permission cards are expanded.
      for (const c of sec.cards) if (state.get(c.id) === "permission") expect(c.expanded).toBe(true);
    }
  }
}

describe("board properties", () => {
  it("holds invariants 1, 2 and 6 cold and after updates, with any focus", () => {
    fc.assert(
      fc.property(runs, ([def, cards, nextStates, focusAt]) => {
        const cold = board(def, null, snap(cards));
        check(cold.layout, cards);
        const mutated = cards.map((c, i) => ({ ...c, state: nextStates[i % Math.max(nextStates.length, 1)] ?? c.state }));
        const focus = mutated[focusAt % Math.max(mutated.length, 1)]?.id ?? null;
        const warm = board(def, cold.layout, snap(mutated, { focus }));
        check(warm.layout, mutated);
      }),
    );
  });
  it("is deterministic: the same input gives the same layout", () => {
    fc.assert(
      fc.property(defArb, cardsArb, (def, cards) => {
        expect(board(def, null, snap(cards))).toEqual(board(def, null, snap([...cards].reverse())));
      }),
    );
  });
  it("is stable: re-running on an unchanged snapshot changes nothing and shakes nothing", () => {
    fc.assert(
      fc.property(defArb, cardsArb, (def, cards) => {
        const first = board(def, null, snap(cards));
        const again = board(def, first.layout, snap(cards));
        expect(again.layout).toEqual(first.layout);
        expect(again.events).toEqual([]);
      }),
    );
  });
});
