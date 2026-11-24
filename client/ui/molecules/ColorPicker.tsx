// Every session color in a small popup, placed at the menu button the way the menu is.
import { Icon } from "@getpaseo/plugin/client/ui";
import { Pressable, Text, View } from "react-native";
import { useFont, usePalette } from "../tokens/context";
import { SESSION_COLORS, isDark, size } from "../tokens/tokens";
import { Popover, type Anchor } from "./Popover";

const GAP = 8;
const PER_ROW = 3;
const PAD = 10;
const WIDTH = PER_ROW * size.swatch + (PER_ROW - 1) * GAP + PAD * 2 + 8;

export function ColorPicker(props: { at: Anchor | null; current?: string; onPick: (colorId: string) => void; onClose: () => void }) {
  const p = usePalette();
  const f = useFont();
  const rows = Math.ceil(SESSION_COLORS.length / PER_ROW);
  const height = rows * size.swatch + (rows - 1) * GAP + PAD * 2 + 8 + 22;
  return (
    <Popover at={props.at} width={WIDTH} height={height} label="color picker" onClose={props.onClose}>
      <View style={{ padding: PAD, gap: GAP }}>
        <Text style={{ color: p.muted, fontSize: f.xxs, letterSpacing: 0.5, textTransform: "uppercase" }}>Card color</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
          {SESSION_COLORS.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Color ${c.id}`}
              accessibilityState={{ selected: props.current === c.id }}
              onPress={() => {
                props.onClose();
                props.onPick(c.id);
              }}
              style={({ pressed }) => ({
                width: size.swatch,
                height: size.swatch,
                borderRadius: size.swatch / 2,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.hex,
                borderWidth: 1,
                borderColor: p.border,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              {props.current === c.id ? <Icon name="Check" size={14} color={isDark(c.hex) ? "#ffffff" : "#111111"} /> : null}
            </Pressable>
          ))}
        </View>
      </View>
    </Popover>
  );
}
