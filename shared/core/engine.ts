import { matches } from "./rule";
import { reconcile, resolveColumns, type ResolvedColumn } from "./workspaces";
import {
  OTHER_COLUMN_ID,
  type BoardDef,
  type BoardEvent,
  type BoardResult,
  type Card,
  type CardState,
  type Layout,
  type LayoutColumn,
  type PlacedCard,
  type Snapshot,
  type SortSpec,
} from "./types";

const ATTENTION = new Set<CardState>(["needs", "permission", "failed", "done"]);
const SETTLES = new Set<CardState>(["done", "failed"]);

type Prev = { columnId: string; sectionId: string; index: number; expanded: boolean };
type Placed = { card: Card; sectionId: string; expanded: boolean };

const defKeyOf = (def: BoardDef) =>
  JSON.stringify([def.columns, def.sections, def.buckets, def.sort]);

function isCollapsed(card: Card, snap: Snapshot): boolean {
  const c = snap.collapsed[card.id];
  if (!c || c.state !== card.state) return false;
  // A finished or failed session reopens as soon as it does something new.
  return !SETTLES.has(card.state) || card.lastActivity <= c.activity;
}

function isExpanded(card: Card, snap: Snapshot): boolean {
  if (card.state === "permission") return true; // invariant 2
  if (isCollapsed(card, snap)) return false;
  if (snap.expanded.has(card.id)) return true;
  return card.state !== "running";
}

function comparator(sort: SortSpec[]) {
  const value = (c: Card, by: SortSpec["by"]) =>
    by === "activity" ? c.lastActivity : by === "title" ? c.title : by === "color" ? c.color : c.waitingSince;
  return (a: Card, b: Card): number => {
    for (const { by, dir } of sort) {
      const x = value(a, by);
      const y = value(b, by);
      if (x === y) continue;
      if (x === undefined) return 1;
      if (y === undefined) return -1;
      // Both sides share a type per key, so the cast is safe.
      const d = (x as number) < (y as number) ? -1 : 1;
      return dir === "asc" ? d : -d;
    }
    return a.id < b.id ? -1 : 1;
  };
}

function sectionIds(col: ResolvedColumn): string[] {
  return col.sections?.length ? col.sections : [""];
}

function sectionOf(def: BoardDef, col: ResolvedColumn, card: Card): string {
  const ids = sectionIds(col);
  const bucket = def.buckets[card.state];
  return bucket !== undefined && ids.includes(bucket) ? bucket : ids[0]!;
}

function indexPrev(prev: Layout | null): Map<string, Prev> {
  const map = new Map<string, Prev>();
  for (const col of prev?.columns ?? []) {
    for (const sec of col.sections) {
      sec.cards.forEach((c, index) =>
        map.set(c.id, { columnId: col.id, sectionId: sec.id, index, expanded: c.expanded }),
      );
    }
  }
  return map;
}

/**
 * Order one section. Cards that kept their column, section and size keep their relative order.
 * A card that came into the expanded stack (joined, or opened) goes to its end, sorted. A card
 * that came into the compact stack by collapsing goes to its top, ahead of the rest; a joiner
 * goes to the end. Expanded cards come before compact ones.
 */
function orderSection(items: Placed[], colId: string, prevPos: Map<string, Prev>, cmp: ReturnType<typeof comparator>) {
  const prevHere = (p: Placed) => {
    const at = prevPos.get(p.card.id);
    return at && at.columnId === colId && at.sectionId === p.sectionId ? at : undefined;
  };
  const block = (expanded: boolean): PlacedCard[] => {
    const inBlock = items.filter((p) => p.expanded === expanded);
    const resized = inBlock.filter((p) => prevHere(p) && prevHere(p)!.expanded !== expanded).sort((a, b) => cmp(a.card, b.card));
    const settled = inBlock.filter((p) => prevHere(p)?.expanded === expanded).sort((a, b) => prevHere(a)!.index - prevHere(b)!.index);
    const joined = inBlock.filter((p) => !prevHere(p)).sort((a, b) => cmp(a.card, b.card));
    const ordered = expanded ? [...settled, ...[...resized, ...joined].sort((a, b) => cmp(a.card, b.card))] : [...resized, ...settled, ...joined];
    return ordered.map((p) => ({ id: p.card.id, expanded }));
  };
  return [...block(true), ...block(false)];
}

export function board(def: BoardDef, prev: Layout | null, snap: Snapshot): BoardResult {
  const state = reconcile(def.state, snap.workspaces);
  const columns = resolveColumns(def, state, snap.workspaces);
  const defKey = defKeyOf(def);
  const sameDef = prev !== null && prev.defKey === defKey;
  const prevPos = sameDef ? indexPrev(prev) : new Map<string, Prev>();
  const colById = new Map(columns.map((c) => [c.id, c]));
  const cmp = comparator(def.sort.length ? def.sort : [{ by: "activity", dir: "desc" }]);

  const byColumn = new Map<string, Placed[]>();
  const other: Placed[] = [];
  for (const card of snap.cards) {
    const col = columns.find((c) => matches(c.match, card, snap.now));
    const placed = { card, sectionId: col ? sectionOf(def, col, card) : "", expanded: isExpanded(card, snap) };
    if (col) byColumn.set(col.id, [...(byColumn.get(col.id) ?? []), placed]);
    else other.push(placed);
  }

  const build = (col: ResolvedColumn | null, items: Placed[]): LayoutColumn => {
    const id = col?.id ?? OTHER_COLUMN_ID;
    const ids = col ? sectionIds(col) : [""];
    return {
      id,
      title: col?.title ?? "Other",
      generated: col?.generated ?? false,
      folded: state.folded[id] ?? (col?.generated === true && items.length === 0),
      count: items.length,
      sections: ids.map((sid) => ({
        id: sid,
        label: def.sections.find((s) => s.id === sid)?.label,
        cards: orderSection(items.filter((p) => p.sectionId === sid), id, prevPos, cmp),
      })),
    };
  };

  const layoutColumns = columns.map((c) => build(c, byColumn.get(c.id) ?? []));
  if (other.length > 0) layoutColumns.push(build(null, other)); // always last, hidden when empty

  const states = Object.fromEntries(snap.cards.map((c) => [c.id, c.state]));
  const events: BoardEvent[] = [];
  if (prev && sameDef) {
    // No shake on first load or after a definition change (invariant 5).
    for (const col of layoutColumns) {
      const shakes = col.sections.some((s) =>
        s.cards.some((p) => {
          const st = states[p.id]!;
          return ATTENTION.has(st) && (prev.states[p.id] !== st || prevPos.get(p.id)?.columnId !== col.id);
        }),
      );
      if (shakes) events.push({ type: "shake", columnId: col.id });
    }
  }
  return { layout: { defKey, columns: layoutColumns, states }, events, state };
}
