import { DEFAULT_DEF, EMPTY_SESSIONS, type BoardDef, type BoardSessions, type BoardView, type Collapse, type Layout } from "../../shared/core";

// A tiny external store. One instance per plugin install; state never lives in module scope.

export type Store<T> = {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
};

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      const value = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}


/** One persisted record as the client holds it. */
export type Record_<T> = {
  value: T;
  /** False while the host has not answered yet. Nothing is written before then. */
  ready: boolean;
  /** False when the stored record was invalid or newer: `value` is the default and the original is kept. */
  ok: boolean;
  original?: unknown;
};

/** Saved through settings: the board definition (this client) and board sessions (this host). */
export type PersistedSlice = { def: Record_<BoardDef>; sessions: Record_<BoardSessions> };

/** Lives while Paseo stays open. */
export type EphemeralSlice = {
  focus: string | null;
  /** Cards the user expanded by hand. */
  expanded: ReadonlySet<string>;
  /** The layout the engine returned last, which it needs to keep placement sticky. */
  layout: Layout | null;
};

export type BoardStoreState = {
  /** Half-typed messages, by session id. */
  drafts: Record<string, string>;
  persisted: PersistedSlice;
  ephemeral: EphemeralSlice;
};

export const createBoardStore = () =>
  createStore<BoardStoreState>({
    drafts: {},
    persisted: {
      def: { value: DEFAULT_DEF, ready: false, ok: true },
      sessions: { value: EMPTY_SESSIONS, ready: false, ok: true },
    },
    ephemeral: { focus: null, expanded: new Set(), layout: null },
  });
export type BoardStore = ReturnType<typeof createBoardStore>;

export const setDraft = (store: BoardStore, agentId: string, text: string) =>
  store.set((s) => {
    if ((s.drafts[agentId] ?? "") === text) return s;
    const { [agentId]: _gone, ...rest } = s.drafts;
    return { ...s, drafts: text ? { ...rest, [agentId]: text } : rest };
  });

// Persisted slice. A record that is not `ok` is read-only: edits are refused so the stored
// original is never overwritten (invariant 8). Resetting it is a separate, explicit action.
const editable = <T,>(r: Record_<T>) => r.ready && r.ok;

export const setDef = (store: BoardStore, next: Record_<BoardDef>) =>
  store.set((s) => (s.persisted.def === next ? s : { ...s, persisted: { ...s.persisted, def: next } }));
export const setSessions = (store: BoardStore, next: Record_<BoardSessions>) =>
  store.set((s) => (s.persisted.sessions === next ? s : { ...s, persisted: { ...s.persisted, sessions: next } }));

export function editDef(store: BoardStore, edit: (def: BoardDef) => BoardDef) {
  store.set((s) => {
    const cur = s.persisted.def;
    if (!editable(cur)) return s;
    const value = edit(cur.value);
    return value === cur.value ? s : { ...s, persisted: { ...s.persisted, def: { ...cur, value } } };
  });
}

export function editSessions(store: BoardStore, edit: (sessions: BoardSessions) => BoardSessions) {
  store.set((s) => {
    const cur = s.persisted.sessions;
    if (!editable(cur)) return s;
    const value = edit(cur.value);
    return value === cur.value ? s : { ...s, persisted: { ...s.persisted, sessions: { ...cur, value } } };
  });
}

export const setView = (store: BoardStore, view: Partial<BoardView>) =>
  editDef(store, (d) => (Object.entries(view).every(([k, v]) => d.view[k as keyof BoardView] === v) ? d : { ...d, view: { ...d.view, ...view } }));

/** Hand-collapse a card, or clear it (`null`). Keyed by session (invariant 10). */
export const setCollapse = (store: BoardStore, id: string, collapse: Collapse | null) =>
  editSessions(store, (x) => {
    if (collapse === null) {
      if (!(id in x.collapsed)) return x;
      const { [id]: _gone, ...rest } = x.collapsed;
      return { ...x, collapsed: rest };
    }
    const cur = x.collapsed[id];
    if (cur && cur.state === collapse.state && cur.activity === collapse.activity) return x;
    return { ...x, collapsed: { ...x.collapsed, [id]: collapse } };
  });

// Ephemeral slice.
const setEphemeral = (store: BoardStore, patch: Partial<EphemeralSlice>) =>
  store.set((s) => {
    const next = { ...s.ephemeral, ...patch };
    return (Object.keys(patch) as Array<keyof EphemeralSlice>).every((k) => Object.is(s.ephemeral[k], next[k])) ? s : { ...s, ephemeral: next };
  });

export const setFocus = (store: BoardStore, id: string | null) => setEphemeral(store, { focus: id });
export const setLayout = (store: BoardStore, layout: Layout | null) => setEphemeral(store, { layout });
export function setExpanded(store: BoardStore, id: string, expanded: boolean) {
  const cur = store.get().ephemeral.expanded;
  if (cur.has(id) === expanded) return;
  const next = new Set(cur);
  if (expanded) next.add(id);
  else next.delete(id);
  setEphemeral(store, { expanded: next });
}
