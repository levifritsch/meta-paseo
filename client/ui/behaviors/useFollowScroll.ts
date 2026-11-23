import { useCallback, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";
import { followReduce, initialFollow, type FollowEvent, type FollowLayout, type FollowState } from "./follow-scroll";

/** Wires the follow-scroll machine to a ScrollView. Spread `scrollProps` onto it. */
export function useFollowScroll() {
  const ref = useRef<ScrollView | null>(null);
  const state = useRef<FollowState>(initialFollow);
  const dims = useRef<FollowLayout>({ replyTop: null, contentHeight: 0, viewportHeight: 0 });
  const [following, setFollowing] = useState(true);

  const dispatch = useCallback((event: FollowEvent) => {
    const result = followReduce(state.current, event);
    state.current = result.state;
    setFollowing(result.state.following);
    if (result.scrollTo !== null) ref.current?.scrollTo({ y: result.scrollTo, animated: false });
  }, []);

  const sendLayout = useCallback(() => dispatch({ type: "layout", ...dims.current }), [dispatch]);

  return {
    /** False once the user scrolls away. Show the jump button then. */
    following,
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
    /** Report where the latest reply starts inside the scroll content, or null before it has one. */
    setReplyTop: (y: number | null) => {
      dims.current.replyTop = y;
      sendLayout();
    },
    /** A new prompt was sent. */
    follow: () => dispatch({ type: "prompt" }),
    /** The jump button. */
    jump: () => dispatch({ type: "jump" }),
    /** Call right after "Show earlier" grew the content above by `addedHeight`. */
    prepended: (addedHeight: number) => dispatch({ type: "prepend", addedHeight }),
  };
}
