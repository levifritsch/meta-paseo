import { Icon, TextInput } from "@getpaseo/plugin/client/ui";
import { useLayoutEffect, useRef, useState } from "react";
import { Platform, Pressable, View, type NativeSyntheticEvent, type TextInput as NativeTextInput, type TextInputKeyPressEventData } from "react-native";
import { usePalette, useFont, useFontScale } from "../tokens/context";
import { isDark, outerGlow, radius, size, tint } from "../tokens/tokens";

/**
 * The message box and its round send button. Enter sends, Shift+Enter adds a line, and the box
 * grows to ten lines at any font scale. `color` (a card's) tints the focus ring and the button.
 */
export function Composer(props: {
  value: string;
  onChange: (text: string) => void;
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  color?: string;
  /** Space under the box. Less when something sits below it. */
  bottomInset?: number;
}) {
  const p = usePalette();
  const f = useFont();
  const scale = useFontScale();
  const input = useRef<NativeTextInput>(null);
  const [focused, setFocused] = useState(false);
  const [nativeHeight, setNativeHeight] = useState<number>(size.input);
  const accent = props.color ?? p.accent;
  const line = size.inputLine * scale;
  const max = size.inputLines * line + size.inputPad * 2 + 2;

  // On web a textarea does not grow with its text: size it to its content, up to the cap.
  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    const el = input.current as unknown as { style?: { height: string; overflowY: string }; scrollHeight: number; offsetHeight: number; clientHeight: number } | null;
    if (!el?.style) return;
    el.style.height = "0px";
    const full = el.scrollHeight + (el.offsetHeight - el.clientHeight);
    el.style.height = `${Math.min(max, Math.max(size.input, full))}px`;
    el.style.overflowY = full > max ? "auto" : "hidden";
  }, [props.value, max]);

  const empty = !props.value.trim();
  const send = () => {
    if (!empty && !props.disabled) props.onSend(props.value.trim());
  };
  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const k = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
    if (k.key === "Enter" && !k.shiftKey) {
      (e as unknown as { preventDefault?: () => void }).preventDefault?.();
      send();
    }
  };
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end", paddingBottom: props.bottomInset ?? size.composerInset, paddingLeft: size.composerInset, paddingRight: size.composerInset }}>
      <TextInput
        ref={input}
        multiline
        value={props.value}
        onChangeText={props.onChange}
        onKeyPress={onKeyPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!props.disabled}
        onContentSizeChange={(e) => {
          if (Platform.OS !== "web") setNativeHeight(Math.min(max, Math.max(size.input, e.nativeEvent.contentSize.height + size.inputPad * 2 + 2)));
        }}
        placeholder={props.placeholder ?? "Message"}
        placeholderTextColor={tint(p.muted, 0.5)}
        style={{
          flex: 1,
          minHeight: size.input,
          maxHeight: max,
          ...(Platform.OS === "web" ? {} : { height: nativeHeight }),
          borderWidth: 1,
          borderColor: focused ? accent : p.border,
          outlineWidth: 0,
          boxShadow: focused ? outerGlow(accent) : undefined,
          borderRadius: radius.field,
          paddingHorizontal: 12,
          paddingVertical: size.inputPad,
          color: p.text,
          backgroundColor: p.bg,
          fontSize: f.lg - 1,
          lineHeight: line,
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send"
        onPress={send}
        disabled={props.disabled || empty}
        style={{
          width: size.input,
          height: size.input,
          borderRadius: size.input / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: accent,
          boxShadow: focused ? outerGlow(accent) : undefined,
          opacity: props.disabled || empty ? 0.5 : 1,
        }}
      >
        <Icon name="ArrowUp" size={16} color={props.color ? (isDark(accent) ? "#ffffff" : "#111111") : p.onAccent} />
      </Pressable>
    </View>
  );
}
