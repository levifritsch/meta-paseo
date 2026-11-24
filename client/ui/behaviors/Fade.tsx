// A soft edge: `color` at one edge of an overlay, fading to nothing across it. Used over a chat
// and a scrolling column in place of divider lines.
import { useLayoutEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { fadeBands } from "../tokens/tokens";

type Edge = "top" | "bottom";

const css = (color: string, edge: Edge) => `linear-gradient(to ${edge === "top" ? "bottom" : "top"}, ${color} 0%, transparent 100%)`;

/**
 * React Native has no gradient that works everywhere, and an unsupported style is dropped
 * silently. On web a CSS gradient goes on the element itself; elsewhere the fade is stacked
 * bands of falling opacity (hex colors only, else nothing).
 */
export function Fade({ color, edge, height }: { color: string; edge: Edge; height: number }) {
  const place = { position: "absolute" as const, left: 0, right: 0, [edge]: 0, height };
  const ref = useRef<View>(null);
  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    const el = ref.current as unknown as { style?: { backgroundImage: string } } | null;
    if (el?.style) el.style.backgroundImage = css(color, edge);
  });
  if (Platform.OS === "web") return <View ref={ref} pointerEvents="none" style={place} />;
  const bands = fadeBands(color, Math.max(8, Math.round(height / 2)));
  if (!bands) return null;
  return (
    <View pointerEvents="none" style={place}>
      {(edge === "top" ? bands : [...bands].reverse()).map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  );
}
