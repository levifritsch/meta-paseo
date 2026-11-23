import { useLayoutEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/**
 * Content added above what the user is reading ("Show earlier"). A new batch is rendered
 * off-flow and invisible first, so nothing moves. Once measured, it joins the flow and
 * `onInserted(height)` runs in the same commit, before paint, to correct the scroll offset.
 * That avoids a frame where the content has shifted but the scroll has not.
 *
 * `inset` is the horizontal padding of the scroll content, so the hidden batch wraps text the
 * same way it will in flow.
 */
export function usePrepend<T>(onInserted: (addedHeight: number) => void, inset: number) {
  const [items, setItems] = useState<T[]>([]);
  const [incoming, setIncoming] = useState<T[] | null>(null);
  const added = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (added.current === null) return;
    const height = added.current;
    added.current = null;
    onInserted(height);
  }, [items]);

  return {
    /** Render in flow, above the rest. */
    items,
    /** Render off-flow with `measureProps` and `hiddenStyle` while non-null. */
    incoming,
    /** Queue a batch to go above `items`. */
    request: (batch: T[]) => setIncoming(batch),
    measureProps: {
      onLayout: (e: LayoutChangeEvent) => {
        if (incoming === null) return;
        added.current = e.nativeEvent.layout.height;
        setItems((prev) => [...incoming, ...prev]);
        setIncoming(null);
      },
    },
    hiddenStyle: { position: "absolute", top: 0, left: inset, right: inset, opacity: 0 } as const,
  };
}
