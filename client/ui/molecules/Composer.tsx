import { TextInput } from "@getpaseo/plugin/client/ui";
import { useState } from "react";
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { View } from "react-native";
import { Btn } from "../atoms";
import { usePalette } from "../tokens/context";
import { font, radius, space } from "../tokens/tokens";

const MAX_LINES = 10;
const LINE = Math.round(font.md * 1.4);

/** The message box. Enter sends, Shift+Enter adds a line, and it grows to ten lines. */
export function Composer(props: {
  value: string;
  onChange: (text: string) => void;
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const p = usePalette();
  const [height, setHeight] = useState(LINE);
  const send = () => {
    const text = props.value.trim();
    if (text && !props.disabled) props.onSend(text);
  };
  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const k = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
    if (k.key === "Enter" && !k.shiftKey) {
      (e as unknown as { preventDefault?: () => void }).preventDefault?.();
      send();
    }
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.md }}>
      <TextInput
        multiline
        value={props.value}
        onChangeText={props.onChange}
        onKeyPress={onKeyPress}
        onContentSizeChange={(e) => setHeight(Math.min(LINE * MAX_LINES, Math.max(LINE, e.nativeEvent.contentSize.height)))}
        placeholder={props.placeholder ?? "Message"}
        placeholderTextColor={p.muted}
        style={{
          flex: 1,
          height: height + space.lg,
          color: p.text,
          fontSize: font.md,
          lineHeight: LINE,
          padding: space.md,
          borderWidth: 1,
          borderColor: p.border,
          borderRadius: radius.md,
          backgroundColor: p.card,
        }}
      />
      <Btn label="Send" onPress={send} disabled={props.disabled || props.value.trim().length === 0} />
    </View>
  );
}
