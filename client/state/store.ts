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

/** Ephemeral slice: lives while Paseo stays open. The persisted slice joins it with step 5. */
export type BoardStoreState = {
  /** Half-typed messages, by session id. */
  drafts: Record<string, string>;
};

export const createBoardStore = () => createStore<BoardStoreState>({ drafts: {} });
export type BoardStore = ReturnType<typeof createBoardStore>;

export const setDraft = (store: BoardStore, agentId: string, text: string) =>
  store.set((s) => {
    if ((s.drafts[agentId] ?? "") === text) return s;
    const { [agentId]: _gone, ...rest } = s.drafts;
    return { ...s, drafts: text ? { ...rest, [agentId]: text } : rest };
  });
