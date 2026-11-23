import { createContext, useCallback, useContext, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { setDraft, type BoardStore, type BoardStoreState } from "./store";

const Ctx = createContext<BoardStore | null>(null);

export function StoreProvider({ store, children }: { store: BoardStore; children: ReactNode }) {
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useBoardStore(): BoardStore {
  const store = useContext(Ctx);
  if (!store) throw new Error("useBoardStore needs a StoreProvider above it");
  return store;
}

/** Read a slice. Pick something that compares by value, such as a string. */
export function useStoreSelector<S>(selector: (s: BoardStoreState) => S): S {
  const store = useBoardStore();
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

/** A half-typed message, kept per session through collapsing and leaving the board. */
export function useDraft(agentId: string): [string, (text: string) => void] {
  const store = useBoardStore();
  const text = useStoreSelector((s) => s.drafts[agentId] ?? "");
  const set = useCallback((next: string) => setDraft(store, agentId, next), [store, agentId]);
  return [text, set];
}

/** Wrap a screen so it reads the install's store. */
export function withStore<P extends object>(store: BoardStore, Component: ComponentType<P>): ComponentType<P> {
  return function WithStore(props: P) {
    return (
      <StoreProvider store={store}>
        <Component {...props} />
      </StoreProvider>
    );
  };
}
