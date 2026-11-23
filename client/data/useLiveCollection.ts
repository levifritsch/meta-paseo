// One live, id-keyed collection from Paseo: a list call that opens a subscription, plus the
// per-item updates that follow. Tells a failed load from an empty list (invariant 9).
import { useEffect, useState } from "react";
import { byId, type ById } from "./live-map";

const RETRY_MS = 5000;

type Snapshot<T> = { entries: Array<{ agent: T } | T> };
type Subscription<T> = {
  subscribe(observer: { snapshot(s: Snapshot<T>): void; update(m: unknown): void }): () => void;
  release(): Promise<void>;
};

export type LiveCollection<T> = {
  items: ById<T>;
  /** False until a load succeeds. A failed load leaves it false, never an empty-but-loaded list. */
  loaded: boolean;
  error: string | null;
};

export function useLiveCollection<T extends { id: string }, U>(opts: {
  /** Opens the list and its subscription. */
  open: () => Promise<{ entries: Array<{ agent: T } | T>; subscription?: Subscription<T> }>;
  /** Registers a handler for item updates; returns its remover. */
  onUpdate: (handler: (u: U) => void) => () => void;
  apply: (items: ById<T>, update: U) => ById<T>;
  deps: unknown[];
}): LiveCollection<T> {
  const [state, setState] = useState<LiveCollection<T>>({ items: new Map(), loaded: false, error: null });

  useEffect(() => {
    let live = true;
    let ready = false;
    let buffered: U[] = [];
    let unsubscribe: (() => void) | undefined;
    let subscription: Subscription<T> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const unwrap = (entries: Array<{ agent: T } | T>) => entries.map((e) => ("agent" in (e as object) ? (e as { agent: T }).agent : (e as T)));

    const removeHandler = opts.onUpdate((u) => {
      if (!live) return;
      // Updates that arrive while the list is loading would be overwritten by it, so hold them.
      if (!ready) buffered.push(u);
      else setState((s) => ({ ...s, items: opts.apply(s.items, u) }));
    });

    const load = () => {
      opts.open().then(
        (r) => {
          if (!live) {
            void r.subscription?.release();
            return;
          }
          subscription = r.subscription;
          let items = byId(unwrap(r.entries));
          for (const u of buffered) items = opts.apply(items, u);
          buffered = [];
          ready = true;
          setState({ items, loaded: true, error: null });
          // After a reconnect the host sends a fresh snapshot: replace, never merge.
          unsubscribe = subscription?.subscribe({
            snapshot: (s) => live && setState({ items: byId(unwrap(s.entries)), loaded: true, error: null }),
            update: () => {},
          });
        },
        (e: unknown) => {
          if (!live) return;
          setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }));
          retry = setTimeout(load, RETRY_MS);
        },
      );
    };
    load();

    return () => {
      live = false;
      removeHandler();
      unsubscribe?.();
      if (retry) clearTimeout(retry);
      void subscription?.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, opts.deps);

  return state;
}
