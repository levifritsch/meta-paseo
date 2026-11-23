import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";
import { motion } from "../tokens/tokens";
import { followReduce, initialFollow, latestOnScreen, type FollowEvent, type FollowLayout, type FollowState } from "./follow-scroll";

/** Wires the follow-scroll machine to a ScrollView. Spread `scrollProps` onto it. */
export function useFollowScroll() {
  const ref = useRef<ScrollView | null>(null);
  const state = useRef<FollowState>(initialFollow);
  const dims = useRef<FollowLayout>({ ...initialFollow.layout });
  const [showJump, setShowJump] = useState(false);
  const jump = useRef<{ shown: boolean; pending: boolean | null; timer: ReturnType<typeof setTimeout> | null }>({ shown: false, pending: null, timer: null });
  useEffect(() => () => { if (jump.current.timer) clearTimeout(jump.current.timer); }, []);

  // The button changes only after the answer holds for a moment. A panel below the chat that
  // changes height resizes the viewport, and the answer flips back and forth while that settles.
  const settleJump = useCallback((next: boolean) => {
    const j = jump.current;
    if (next === j.shown) {
      if (j.timer) clearTimeout(j.timer);
      j.timer = null;
      j.pending = null;
      return;
    }
    if (j.pending === next) return;
    if (j.timer) clearTimeout(j.timer);
    j.pending = next;
    j.timer = setTimeout(() => {
      j.shown = next;
      j.pending = null;
      j.timer = null;
      setShowJump(next);
    }, motion.settle);
  }, []);

  const dispatch = useCallback((event: FollowEvent) => {
    const result = followReduce(state.current, event);
    state.current = result.state;
    settleJump(!latestOnScreen(result.state));
    if (result.scrollTo !== null) ref.current?.scrollTo({ y: result.scrollTo, animated: false });
  }, [settleJump]);

  const sendLayout = useCallback(() => dispatch({ type: "layout", ...dims.current }), [dispatch]);

  return {
    /** True when the latest reply is off screen. Show the jump button then. */
    showJump,
    scrollProps: {
      ref,
      scrollEventThrottle: 16,
      onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
        dispatch({ type: "scroll", offset: e.nativeEvent.contentOffset.y }),
      onContentSizeChange: (_w: number, h: number) => {
        dims.current.contentHeight = h;
        sendLayout();
      },
      onLayout: (e: LayoutChangeEvent) => {
        dims.current.viewportHeight = e.nativeEvent.layout.height;
        sendLayout();
      },
    },
    /** Report the latest reply's place inside the scroll content, or null before it has one. */
    setReply: (reply: { top: number; height: number } | null) => {
      dims.current.replyTop = reply?.top ?? null;
      dims.current.replyHeight = reply?.height ?? null;
      sendLayout();
    },
    /** A new prompt was sent, or the jump button: follow the top of the latest reply. */
    follow: () => dispatch({ type: "prompt" }),
    /** Call right after "Show earlier" grew the content above by `addedHeight`. */
    prepended: (addedHeight: number) => dispatch({ type: "prepend", addedHeight }),
  };
}
