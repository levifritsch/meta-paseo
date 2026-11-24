import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { foldCode } from "../../../shared/core";
import { Switch } from "../atoms";
import { usePalette, useFont } from "../tokens/context";
import { radius, size, space } from "../tokens/tokens";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, Menlo, monospace" });

/**
 * A command or diff. Up to 10 lines show whole; longer folds to the first 5 with Show more.
 * "Wrap lines" turns wrapping on or off; with it off, long lines scroll sideways.
 */
export function CodeBlock({ text, wrapByDefault = false }: { text: string; wrapByDefault?: boolean }) {
  const p = usePalette();
  const f = useFont();
  const [expanded, setExpanded] = useState(false);
  const [wrap, setWrap] = useState(wrapByDefault);
  const folded = foldCode(text, expanded);
  const body = (
    <Text selectable style={{ color: p.text, fontFamily: MONO, fontSize: f.sm }}>
      {folded.shown}
    </Text>
  );
  return (
    <View style={{ backgroundColor: p.chrome, borderRadius: radius.md, padding: space.md, gap: space.md }}>
      {/* A long script or diff scrolls inside its box instead of growing past the chat. */}
      <ScrollView style={{ maxHeight: size.code }} nestedScrollEnabled>
        {wrap ? body : <ScrollView horizontal>{body}</ScrollView>}
      </ScrollView>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xl }}>
        {folded.foldable && (
          <Pressable accessibilityRole="button" onPress={() => setExpanded((v) => !v)}>
            <Text style={{ color: p.accent, fontSize: f.sm }}>
              {expanded ? "Show less" : `Show more (${folded.hiddenLines} more lines)`}
            </Text>
          </Pressable>
        )}
        <Switch label="Wrap lines" value={wrap} onValueChange={setWrap} />
      </View>
    </View>
  );
}
