// Gives every session a color (P1 to P3) once both the sessions and the stored record have loaded.
import { useEffect } from "react";
import { assignColors, pruneBySession, type Card, type PaletteEntry } from "../../shared/core";
import { editSessions, type BoardStore } from "./store";
import { useStoreSelector } from "./StoreContext";

/** `palette` is passed in because state sits below the UI layer that owns the colors. */
export function useAssignColors(
  store: BoardStore,
  palette: readonly PaletteEntry[],
  data: { cards: Card[]; extras: Record<string, { createdAt: number }>; loaded: boolean; knownIds: ReadonlySet<string> },
  rand: () => number = Math.random,
) {
  const writable = useStoreSelector((s) => s.persisted.sessions.ready && s.persisted.sessions.ok);
  useEffect(() => {
    if (!writable || !data.loaded) return;
    const sessions = data.cards.map((c) => ({ id: c.id, createdAt: data.extras[c.id]?.createdAt ?? c.lastActivity }));
    editSessions(store, (x) => {
      const colors = pruneBySession(assignColors(palette, x.colors, sessions, rand), data.knownIds, data.loaded);
      const collapsed = pruneBySession(x.collapsed, data.knownIds, data.loaded);
      return colors === x.colors && collapsed === x.collapsed ? x : { ...x, colors, collapsed };
    });
  }, [store, palette, writable, data.loaded, data.cards, data.extras, data.knownIds]);
}
