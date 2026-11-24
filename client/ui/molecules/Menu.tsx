// A "⋯" button and the menu under it: rows with an icon, grouped by rules. The panel is a Popover.
import { Icon } from "@getpaseo/plugin/client/ui";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { IconButton, useHover } from "../atoms";
import { useFont, usePalette } from "../tokens/context";
import { MONO, icon, radius, size, space, tint } from "../tokens/tokens";
import { Popover, usePopover, type Anchor } from "./Popover";

export type MenuRow = {
  key: string;
  label: string;
  /** A Lucide icon name. */
  icon: string;
  /** Gets the button's place, for a row that opens something else beside it (the color picker). */
  onPress: (at: Anchor) => void;
  danger?: boolean;
  hint?: string;
  /** A row that asks once more: its first press shows this label, the second runs `onPress`. */
  confirm?: string;
};

function Row({ row, onRun }: { row: MenuRow; onRun: (row: MenuRow) => void }) {
  const p = usePalette();
  const f = useFont();
  const { hovered, props } = useHover();
  const [asking, setAsking] = useState(false);
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={() => (row.confirm && !asking ? setAsking(true) : onRun(row))}
      {...props}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.snug,
        height: size.menuRow,
        paddingHorizontal: space.snug,
        borderRadius: radius.control,
        backgroundColor: pressed ? tint(p.border, 0.75) : hovered ? tint(p.border, 0.45) : "transparent",
      })}
    >
      <Icon name={row.icon} size={icon.md} color={row.danger ? p.error : p.muted} />
      <Text style={{ flex: 1, color: row.danger ? p.error : p.text, fontSize: f.md }}>{asking && row.confirm ? row.confirm : row.label}</Text>
      {row.hint ? <Text style={{ color: p.muted, fontSize: f.xxs, fontFamily: MONO }}>{row.hint}</Text> : null}
    </Pressable>
  );
}

/** `groups` are separated by a rule. Rows close the menu, then run. */
export function MenuButton({ label, groups }: { label: string; groups: readonly (readonly MenuRow[])[] }) {
  const p = usePalette();
  const pop = usePopover();
  const rows = groups.reduce((n, g) => n + g.length, 0);
  const run = (row: MenuRow) => {
    const at = pop.at;
    pop.close();
    if (at) row.onPress(at);
  };
  return (
    <>
      <View ref={pop.ref} collapsable={false}>
        <IconButton icon="Ellipsis" label={label} active={pop.at !== null} onPress={pop.at ? pop.close : pop.open} />
      </View>
      <Popover at={pop.at} width={size.menuWidth} height={rows * size.menuRow + (groups.length - 1) * size.menuRule + 2 * size.popoverPad} label="menu" onClose={pop.close}>
        {groups.map((group, i) => (
          <View key={i}>
            {i > 0 ? <View style={{ height: size.hairline, backgroundColor: p.border, marginVertical: space.sm, marginHorizontal: space.xs }} /> : null}
            {group.map((row) => (
              <Row key={row.key} row={row} onRun={run} />
            ))}
          </View>
        ))}
      </Popover>
    </>
  );
}
