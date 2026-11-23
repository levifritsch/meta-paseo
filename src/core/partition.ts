import { OTHER_COLUMN_ID, type BoardDef, type Card, type Layout, type Rule } from "./types";

export function matches(rule: Rule, card: Card): boolean {
  if (rule.state !== undefined && rule.state !== card.state) return false;
  if (rule.workspace !== undefined && rule.workspace !== card.workspace) return false;
  if (rule.not && matches(rule.not, card)) return false;
  if (rule.any && !rule.any.some((r) => matches(r, card))) return false;
  return true;
}

// First matching column wins; the rest fall to a trailing "Other", hidden when empty.
export function partition(def: BoardDef, cards: Card[]): Layout {
  const columns = def.columns.map((c) => ({ id: c.id, title: c.title, cardIds: [] as string[] }));
  const other: string[] = [];
  for (const card of cards) {
    const i = def.columns.findIndex((c) => matches(c.match, card));
    (i === -1 ? other : columns[i]!.cardIds).push(card.id);
  }
  if (other.length > 0) columns.push({ id: OTHER_COLUMN_ID, title: "Other", cardIds: other });
  return { columns };
}
