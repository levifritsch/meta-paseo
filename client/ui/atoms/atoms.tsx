// Stateless, domain-free atoms. They know tokens and nothing about cards or Paseo.
import { Icon } from "@getpaseo/plugin/client/ui";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useFont, usePalette } from "../tokens/context";
import { icon, opacity, radius, size, space, tint, toneColor, type Tone } from "../tokens/tokens";
import { canStep, stepValue } from "./stepper-math";

/**
 * A status dot. `ring` (running) draws a smaller dot inside a spinning ring; `alert` (failed)
 * swaps it for an alert symbol. Both ignore `diameter`.
 */
export function Dot({ color, diameter = size.dot, ring, alert }: { color: string; diameter?: number; ring?: boolean; alert?: boolean }) {
  if (alert) return <Icon name="CircleAlert" size={size.spinner} color={color} />;
  if (ring) return <SpinnerDot color={color} />;
  return <View style={{ width: diameter, height: diameter, borderRadius: radius.pill, backgroundColor: color }} />;
}

function SpinnerDot({ color }: { color: string }) {
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: Platform.OS !== "web" }));
    loop.start();
    return () => loop.stop();
  }, [turn]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const d = size.spinner;
  return (
    <View style={{ width: d, height: d, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{ position: "absolute", width: d, height: d, borderRadius: d / 2, borderWidth: size.spinnerRing, borderColor: tint(color, 0.22), borderTopColor: color, transform: [{ rotate }] }}
      />
      <View style={{ width: size.spinnerCore, height: size.spinnerCore, borderRadius: size.spinnerCore / 2, backgroundColor: color }} />
    </View>
  );
}

/** Hover state for web; native never fires it. */
export function useHover() {
  const [hovered, setHovered] = useState(false);
  return { hovered, props: { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) } };
}

export type BtnVariant = "solid" | "ghost" | "danger" | "plain";

export function Btn(props: {
  label: string;
  onPress: () => void;
  /** `solid` is filled in `color` (the accent by default), `plain` is outlined, `ghost` has no frame. */
  variant?: BtnVariant;
  disabled?: boolean;
  small?: boolean;
  /** A Lucide icon name, shown before the label. */
  icon?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  const f = useFont();
  const variant = props.variant ?? "solid";
  const fill = variant === "solid" ? (props.color ?? p.accent) : variant === "danger" ? p.error : "transparent";
  const fg = variant === "solid" || variant === "danger" ? p.onAccent : variant === "ghost" ? p.muted : p.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: space.tight,
          paddingHorizontal: props.small ? space.md : space.cozy,
          paddingVertical: props.small ? space.thin : space.run,
          borderRadius: radius.control,
          borderWidth: variant === "ghost" ? 0 : size.hairline,
          borderColor: variant === "plain" ? p.border : fill,
          backgroundColor: fill,
          opacity: props.disabled ? opacity.disabled : pressed ? opacity.pressed : 1,
        },
        props.style,
      ]}
    >
      {props.icon ? <Icon name={props.icon} size={icon.sm} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: f.sm, fontWeight: variant === "solid" ? "600" : "400" }}>{props.label}</Text>
    </Pressable>
  );
}

/** A small square button holding one icon. */
export function IconButton(props: { icon: string; label: string; onPress: () => void; active?: boolean; disabled?: boolean }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      disabled={props.disabled}
      onPress={props.onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        width: size.iconButtonW,
        height: size.iconButtonH,
        borderRadius: radius.control,
        alignItems: "center",
        justifyContent: "center",
        opacity: props.disabled ? opacity.disabled : 1,
        backgroundColor: props.active || pressed ? tint(p.border, 0.6) : "transparent",
      })}
    >
      <Icon name={props.icon} size={icon.lg} color={p.muted} />
    </Pressable>
  );
}

export function Chip(props: { label: string; count?: number; selected?: boolean; tone?: Tone; onPress?: () => void }) {
  const p = usePalette();
  const f = useFont();
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
        borderWidth: size.hairline,
        borderColor: props.selected ? color : p.border,
        backgroundColor: props.selected ? tint(color, 0.15) : "transparent",
      }}
    >
      <Text style={{ color: p.text, fontSize: f.sm }}>{props.label}</Text>
      {props.count !== undefined && <Text style={{ color, fontSize: f.sm, fontWeight: "600" }}>{props.count}</Text>}
    </Pressable>
  );
}

/** A count in a tinted pill, in a tone or any `color`. Renders nothing at zero. */
export function Badge({ count, tone = "neutral", color }: { count: number; tone?: Tone; color?: string }) {
  const p = usePalette();
  const f = useFont();
  if (count <= 0) return null;
  const c = color ?? toneColor(p, tone);
  return (
    <View accessibilityLabel={`${count}`} style={{ paddingHorizontal: space.run, paddingVertical: size.hairline, borderRadius: radius.pill, backgroundColor: tint(c, 0.16) }}>
      <Text style={{ color: c, fontSize: f.xxs, fontWeight: "600" }}>{count}</Text>
    </View>
  );
}

export function Switch(props: { value: boolean; onValueChange: (next: boolean) => void; label: string }) {
  const p = usePalette();
  const f = useFont();
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
      <View style={{ width: w, height: knob + space.md, borderRadius: radius.pill, padding: space.sm, justifyContent: "center", backgroundColor: props.value ? p.accent : p.chrome }}>
        <View style={{ width: knob, height: knob, borderRadius: radius.pill, backgroundColor: props.value ? p.onAccent : p.muted, alignSelf: props.value ? "flex-end" : "flex-start" }} />
      </View>
      <Text style={{ color: p.text, fontSize: f.sm }}>{props.label}</Text>
    </Pressable>
  );
}

/** A value with small − and + buttons. */
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
  const f = useFont();
  const button = (dir: 1 | -1) => (
    <Btn
      small
      label={dir === 1 ? "+" : "−"}
      disabled={!canStep(props.value, dir, props.min, props.max)}
      onPress={() => props.onChange(stepValue(props.value, dir, props.min, props.max, props.step))}
    />
  );
  return (
    <View accessibilityLabel={props.label} style={{ flexDirection: "row", alignItems: "center", gap: space.run }}>
      {button(-1)}
      <Text style={{ color: p.text, fontSize: f.sm, minWidth: size.stepperValue, textAlign: "center", fontVariant: ["tabular-nums"] }}>{(props.format ?? String)(props.value)}</Text>
      {button(1)}
    </View>
  );
}

/** A compact radio group, with an optional label before it. */
export function Segmented<V extends string>(props: {
  options: readonly { value: V; label: string }[];
  value: V;
  onChange: (next: V) => void;
  label?: string;
}) {
  const p = usePalette();
  const f = useFont();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.run }}>
      {props.label ? <Text style={{ color: p.muted, fontSize: f.sm }}>{props.label}</Text> : null}
      <View accessibilityRole="radiogroup" style={{ flexDirection: "row", padding: space.xs, borderRadius: radius.segment, borderWidth: size.hairline, borderColor: p.border }}>
        {props.options.map((o) => {
          const on = o.value === props.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => props.onChange(o.value)}
              style={({ pressed }) => ({ paddingHorizontal: space.snug, paddingVertical: space.thin, borderRadius: radius.option, backgroundColor: on ? tint(p.border, 0.9) : pressed ? tint(p.border, 0.4) : "transparent" })}
            >
              <Text style={{ color: on ? p.text : p.muted, fontSize: f.sm }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** A thin rule with a small centered label sitting on it. */
export function LabeledRule({ label }: { label: string }) {
  const p = usePalette();
  const f = useFont();
  const line = <View style={{ flex: 1, height: size.hairline, backgroundColor: p.border }} />;
  return (
    <View accessibilityRole="header" style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      {line}
      <Text style={{ color: p.muted, fontSize: f.xxs, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</Text>
      {line}
    </View>
  );
}
