// Stateless, domain-free atoms. They know tokens and nothing about cards or Paseo.
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { usePalette } from "../tokens/context";
import { font, radius, size, space, tint, toneColor, type Tone } from "../tokens/tokens";
import { canStep, stepValue } from "./stepper-math";

export function Dot({ color, diameter = size.dot }: { color: string; diameter?: number }) {
  return <View style={{ width: diameter, height: diameter, borderRadius: radius.pill, backgroundColor: color }} />;
}

export type BtnVariant = "solid" | "ghost" | "danger";

export function Btn(props: {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  const variant = props.variant ?? "solid";
  const bg = variant === "solid" ? p.accent : variant === "danger" ? p.error : "transparent";
  const fg = variant === "ghost" ? p.text : p.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={[
        {
          height: size.control,
          paddingHorizontal: space.lg,
          borderRadius: radius.md,
          justifyContent: "center",
          backgroundColor: bg,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: p.border,
          opacity: props.disabled ? 0.4 : 1,
        },
        props.style,
      ]}
    >
      <Text style={{ color: fg, fontSize: font.sm, fontWeight: "600" }}>{props.label}</Text>
    </Pressable>
  );
}

export function Chip(props: { label: string; count?: number; selected?: boolean; tone?: Tone; onPress?: () => void }) {
  const p = usePalette();
  const color = toneColor(p, props.tone ?? "neutral");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        paddingHorizontal: space.md,
        height: size.control - space.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: props.selected ? color : p.border,
        backgroundColor: props.selected ? tint(color, 0.15) : "transparent",
      }}
    >
      <Text style={{ color: p.text, fontSize: font.sm }}>{props.label}</Text>
      {props.count !== undefined && <Text style={{ color, fontSize: font.sm, fontWeight: "600" }}>{props.count}</Text>}
    </Pressable>
  );
}

/** A count in the tone of the loudest kind. Renders nothing at zero. */
export function Badge({ count, tone }: { count: number; tone: Tone }) {
  const p = usePalette();
  if (count <= 0) return null;
  return (
    <View
      accessibilityLabel={`${count}`}
      style={{
        minWidth: size.badge,
        height: size.badge,
        paddingHorizontal: space.sm,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: toneColor(p, tone),
      }}
    >
      <Text style={{ color: p.onAccent, fontSize: font.xs, fontWeight: "700" }}>{count}</Text>
    </View>
  );
}

export function Switch(props: { value: boolean; onValueChange: (next: boolean) => void; label: string }) {
  const p = usePalette();
  const w = size.control + space.md;
  const knob = size.control - space.lg;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={props.label}
      accessibilityState={{ checked: props.value }}
      onPress={() => props.onValueChange(!props.value)}
      style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
    >
      <View
        style={{
          width: w,
          height: knob + space.md,
          borderRadius: radius.pill,
          padding: space.sm,
          justifyContent: "center",
          backgroundColor: props.value ? p.accent : p.chrome,
        }}
      >
        <View
          style={{
            width: knob,
            height: knob,
            borderRadius: radius.pill,
            backgroundColor: props.value ? p.onAccent : p.muted,
            alignSelf: props.value ? "flex-end" : "flex-start",
          }}
        />
      </View>
      <Text style={{ color: p.text, fontSize: font.sm }}>{props.label}</Text>
    </Pressable>
  );
}

/** − and + around a value. The caller formats it (for example 100%). */
export function Stepper(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  format?: (value: number) => string;
  label: string;
}) {
  const p = usePalette();
  const button = (dir: 1 | -1) => {
    const enabled = canStep(props.value, dir, props.min, props.max);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${dir === 1 ? "Increase" : "Decrease"} ${props.label}`}
        disabled={!enabled}
        onPress={() => props.onChange(stepValue(props.value, dir, props.min, props.max, props.step))}
        style={{
          width: size.control,
          height: size.control,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: p.border,
          opacity: enabled ? 1 : 0.4,
        }}
      >
        <Text style={{ color: p.text, fontSize: font.lg }}>{dir === 1 ? "+" : "−"}</Text>
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      {button(-1)}
      <Text style={{ color: p.text, fontSize: font.sm, minWidth: 40, textAlign: "center" }}>
        {(props.format ?? String)(props.value)}
      </Text>
      {button(1)}
    </View>
  );
}

export function Segmented<V extends string>(props: {
  options: readonly { value: V; label: string }[];
  value: V;
  onChange: (next: V) => void;
}) {
  const p = usePalette();
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: "row", borderRadius: radius.md, borderWidth: 1, borderColor: p.border, overflow: "hidden" }}
    >
      {props.options.map((o) => {
        const selected = o.value === props.value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => props.onChange(o.value)}
            style={{
              height: size.control,
              paddingHorizontal: space.lg,
              justifyContent: "center",
              backgroundColor: selected ? p.accent : "transparent",
            }}
          >
            <Text style={{ color: selected ? p.onAccent : p.text, fontSize: font.sm }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
