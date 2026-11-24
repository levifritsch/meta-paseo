import { Markdown } from "@getpaseo/plugin/client/ui";
import { useLayoutEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { useFontScale } from "../tokens/context";

/** Replies render at this size relative to Paseo's Markdown; prompts and tool rows are small already. */
export const REPLY_SCALE = 0.8;

/**
 * Paseo's Markdown takes no size of its own, so it ignores the font scale. On web CSS `zoom`
 * scales it with its layout; elsewhere it stays at full size rather than overlap what follows.
 */
export function Reply({ text, scale = REPLY_SCALE }: { text: string; scale?: number }) {
  const ref = useRef<View>(null);
  const fontScale = useFontScale();
  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    const el = ref.current as unknown as { style?: { zoom: string } } | null;
    if (el?.style) el.style.zoom = String(scale * fontScale);
  });
  return (
    <View ref={ref}>
      <Markdown>{text}</Markdown>
    </View>
  );
}
