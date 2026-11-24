// Runs the board engine on every change and keeps what it hands back: the layout (so placement
// stays sticky) and the reconciled workspace state (saved with the definition).
import { useEffect, useMemo } from "react";
import { commitBoardState, setLayout, type BoardStore } from "./store";
import { runBoard, type BoardInputs } from "./run-board";
import { useStoreSelector } from "./StoreContext";

export function useBoard(store: BoardStore, data: BoardInputs) {
  const def = useStoreSelector((s) => s.persisted.def.value);
  const sessions = useStoreSelector((s) => s.persisted.sessions.value);
  const focus = useStoreSelector((s) => s.ephemeral.focus);
  const expanded = useStoreSelector((s) => s.ephemeral.expanded);
  const { cards, now } = data;
  const { loaded, list } = data.workspaces;
  const result = useMemo(
    // The previous layout is read, not watched: it changes as a result of this run.
    () => runBoard(def, store.get().ephemeral.layout, { cards, workspaces: { loaded, list }, now }, sessions, focus, expanded),
    [store, def, sessions, focus, expanded, cards, loaded, list, now],
  );
  useEffect(() => {
    setLayout(store, result.layout);
    commitBoardState(store, result.state);
  }, [store, result]);
  return result;
}
