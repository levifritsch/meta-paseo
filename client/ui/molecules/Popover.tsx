// A panel that hangs from its button. It lives in a transparent native Modal at the button's
// window position, so nothing can clip it or paint over it, and a press outside closes it.
import { useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { usePalette } from "../tokens/context";
import { radius } from "../tokens/tokens";
import { place, type Anchor } from "./popover-math";

export type { Anchor } from "./popover-math";

/** Measure a button on demand. Put `ref` on a `collapsable={false}` View around it. */
export function useAnchor() {
  const ref = useRef<View>(null);
  const measure = (then: (at: Anchor) => void) => ref.current?.measureInWindow((x, y, w, h) => then({ x, y, w, h }));
  return { ref, measure };
}

export function Popover(props: { at: Anchor | null; width: number; height: number; label: string; onClose: () => void; children: ReactNode }) {
  const p = usePalette();
  const win = useWindowDimensions();
  const pos = props.at ? place(props.at, props, win) : { left: 0, top: 0 };
  return (
    <Modal transparent visible={props.at !== null} animationType="none" onRequestClose={props.onClose}>
      <Pressable accessibilityLabel={`Close ${props.label}`} style={StyleSheet.absoluteFill} onPress={props.onClose} />
      <View
        style={{
          position: "absolute",
          ...pos,
          width: props.width,
          padding: 4,
          borderRadius: radius.menu,
          borderWidth: 1,
          borderColor: p.border,
          backgroundColor: p.card,
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        {props.children}
      </View>
    </Modal>
  );
}

/** Open/close state for a popover that hangs from one button. */
export function usePopover() {
  const anchor = useAnchor();
  const [at, setAt] = useState<Anchor | null>(null);
  return { ...anchor, at, setAt, open: () => anchor.measure(setAt), close: () => setAt(null) };
}
