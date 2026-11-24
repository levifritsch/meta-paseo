import { useMemo, useRef, type ReactNode } from "react";
import { View } from "react-native";
import { createFocusTracker } from "./focus-scope";

/**
 * Reports whether focus is anywhere inside it. Verified on web in spike 4b.0: focus events bubble
 * from any input in the subtree, and `tabIndex: -1` makes a click on the padding land on the
 * container, so focus stays inside. The input-reporting fallback for native is untried.
 */
export function FocusScope({ onChange, children }: { onChange: (inside: boolean) => void; children: ReactNode }) {
  const latest = useRef(onChange);
  latest.current = onChange;
  const tracker = useMemo(() => createFocusTracker((inside) => latest.current(inside)), []);
  // `onFocus` and `onBlur` are not in React Native's View props; react-native-web forwards them.
  const bubble = { onFocus: () => tracker.enter("scope"), onBlur: () => tracker.leave("scope"), tabIndex: -1, style: { outlineStyle: "none" } } as object;
  return <View {...bubble}>{children}</View>;
}
