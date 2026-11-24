// A small dropdown: a "⋯" trigger and a panel under it. The caller owns what is inside.
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { usePalette } from "../tokens/context";
import { font, radius, size, space } from "../tokens/tokens";

export function Menu(props: { open: boolean; onOpenChange: (open: boolean) => void; label: string; children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ position: "relative", zIndex: props.open ? 10 : 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.label}
        accessibilityState={{ expanded: props.open }}
        onPress={() => props.onOpenChange(!props.open)}
        style={{ width: size.control, height: size.control, alignItems: "center", justifyContent: "center", borderRadius: radius.md }}
      >
        <Text style={{ color: p.muted, fontSize: font.lg, fontWeight: "700" }}>⋯</Text>
      </Pressable>
      {props.open && (
        <View
          style={{
            position: "absolute",
            top: size.control,
            right: 0,
            width: size.menu,
            padding: space.sm,
            gap: space.xs,
            backgroundColor: p.chrome,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: p.border,
          }}
        >
          {props.children}
        </View>
      )}
    </View>
  );
}

export function MenuItem(props: { label: string; onPress: () => void; danger?: boolean }) {
  const p = usePalette();
  return (
    <Pressable accessibilityRole="menuitem" onPress={props.onPress} style={{ paddingHorizontal: space.md, paddingVertical: space.md, borderRadius: radius.sm }}>
      <Text style={{ color: props.danger ? p.error : p.text, fontSize: font.sm }}>{props.label}</Text>
    </Pressable>
  );
}
