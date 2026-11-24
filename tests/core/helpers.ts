import type { BoardResult, Card, Layout, Snapshot } from "../../shared/core";

export const card = (id: string, over: Partial<Card> = {}): Card => ({
  id,
  state: "running",
  workspace: "w1",
  title: id,
  lastActivity: 100,
  ...over,
});

export const snap = (cards: Card[], over: Partial<Snapshot> = {}): Snapshot => ({
  cards,
  workspaces: { loaded: true, list: [{ id: "w1", name: "One" }, { id: "w2", name: "Two" }] },
  now: 1000,
  collapsed: {},
  expanded: new Set(),
  ...over,
});

/** Card ids of one section, in order. */
export const ids = (layout: Layout, colId: string, sectionId = ""): string[] =>
  layout.columns.find((c) => c.id === colId)?.sections.find((s) => s.id === sectionId)?.cards.map((c) => c.id) ?? [];

export const colIds = (r: BoardResult) => r.layout.columns.map((c) => c.id);
