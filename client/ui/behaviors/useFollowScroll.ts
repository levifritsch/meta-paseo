import { useCallback, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";
import { followReduce, initialFollow, latestOnScreen, type FollowEvent, type FollowLayout, type FollowState } from "./follow-scroll";

/** Wires the follow-scroll machine to a ScrollView. Spread `scrollProps` onto it. */
export function useFollowScroll() {
  const ref = useRef<ScrollView | null>(null);
  const state = useRef<FollowState>(initialFollow);
  const dims = useRef<FollowLayout>({ ...initialFollow.layout });
  const [showJump, setShowJump] = useState(false);

  const dispatch = useCallback((event: FollowEvent) => {
    const result = followReduce(state.current, event);
    state.current = result.state;
    setShowJump(!latestOnScreen(result.state));
    if (result.scrollTo !== null) ref.current?.scrollTo({ y: result.scrollTo, animated: false });
  }, []);

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
