// The top bar's "View Options" dropdown: column width and card font scale. It stays open while you step a value.
import { Icon } from "@getpaseo/plugin/client/ui";
import { Pressable, Text, View } from "react-native";
import { Stepper, useHover } from "../atoms";
import { Popover, usePopover } from "../molecules";
import { useFont, usePalette } from "../tokens/context";
import { VIEW_LIMITS } from "../../../shared/core";
import { icon, radius, size, space, tint } from "../tokens/tokens";

function OptionRow(props: { label: string; children: React.ReactNode }) {
  const p = usePalette();
  const f = useFont();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.run, paddingHorizontal: space.snug, height: size.menuRow }}>
      <Text style={{ flex: 1, color: p.text, fontSize: f.md }}>{props.label}</Text>
      {props.children}
    </View>
  );
}

export function ViewOptions(props: { columnWidth: number; fontScale: number; onColumnWidth: (v: number) => void; onFontScale: (v: number) => void }) {
  const p = usePalette();
  const f = useFont();
  const pop = usePopover();
  const { hovered, props: hover } = useHover();
  return (
    <>
      <View ref={pop.ref} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View Options"
          accessibilityState={{ expanded: pop.at !== null }}
          onPress={pop.at ? pop.close : pop.open}
          {...hover}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: space.tight,
            paddingHorizontal: space.md,
            paddingVertical: space.thin,
            borderRadius: radius.control,
            borderWidth: size.hairline,
            borderColor: p.border,
            backgroundColor: pop.at ? tint(p.border, 0.6) : pressed || hovered ? tint(p.border, 0.4) : "transparent",
          })}
        >
          <Text style={{ color: p.text, fontSize: f.sm }}>View Options</Text>
          <Icon name="ChevronDown" size={icon.sm} color={p.muted} />
        </Pressable>
      </View>
      <Popover at={pop.at} width={size.optionsWidth} height={2 * size.menuRow + 2 * space.sm} label="view options" onClose={pop.close}>
        <OptionRow label="Column width">
          <Stepper label="column width" {...VIEW_LIMITS.columnWidth} value={props.columnWidth} format={(v) => `${v}px`} onChange={props.onColumnWidth} />
        </OptionRow>
        <OptionRow label="Card font scale">
          <Stepper label="card font scale" {...VIEW_LIMITS.fontScale} value={props.fontScale} format={(v) => `${Math.round(v * 100)}%`} onChange={props.onFontScale} />
        </OptionRow>
      </Popover>
    </>
  );
}
