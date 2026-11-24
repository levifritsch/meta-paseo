// Small pieces a card is built from. Each is stateless apart from its own hover.
import { Icon } from "@getpaseo/plugin/client/ui";
import { Pressable, Text, View } from "react-native";
import { useHover } from "../atoms";
import { useFont, usePalette } from "../tokens/context";
import { halo, type Palette } from "../tokens/tokens";

const clip = { overflow: "hidden" } as const;

/** A title that is a link to the session's chat. Only the words are the link, so the rest of a compact card still expands it. */
export function TitleLink(props: { title: string; lines: number; onOpen?: () => void; style: { fontSize: number; fontWeight: "600" | "700"; lineHeight?: number } }) {
  const p = usePalette();
  const { hovered, props: hover } = useHover();
  // Mouse events reach the DOM on web and are ignored on native; React Native's types omit them for Text.
  const events = { onMouseEnter: hover.onHoverIn, onMouseLeave: hover.onHoverOut } as object;
  return (
    <Text numberOfLines={props.lines} style={[{ color: p.text }, props.style, clip]}>
      <Text
        accessibilityRole={props.onOpen ? "link" : "text"}
        accessibilityLabel={props.onOpen ? `Open chat: ${props.title}` : undefined}
        onPress={props.onOpen}
        {...events}
        style={{ cursor: props.onOpen ? "pointer" : "auto", textDecorationLine: props.onOpen && hovered ? "underline" : "none" } as object}
      >
        {props.title}
      </Text>
    </Text>
  );
}

/** Model, context use and helper counts. `over` draws them over the chat's bottom fade, with a halo to read through. */
export function MetaTags(props: { model?: string; contextPercent: number | null; subAgents: number; backgroundTasks: number; over?: boolean }) {
  const p = usePalette();
  const f = useFont();
  const shadow = props.over ? [halo(p.card), { padding: 12, margin: -12 }] : null;
  const small = { color: p.muted, fontSize: f.xs, fontVariant: ["tabular-nums" as const] };
  const label = [
    props.contextPercent === null ? null : `Context used ${props.contextPercent} percent`,
    props.subAgents > 0 ? `${props.subAgents} sub-agents` : null,
    props.backgroundTasks > 0 ? `${props.backgroundTasks} background tasks` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <View accessibilityLabel={label || undefined} style={{ flexDirection: "row", alignItems: "center", flexShrink: 1, minWidth: 0 }}>
      {props.model ? (
        <Text numberOfLines={1} style={[{ color: p.muted, fontSize: f.sm, flexShrink: 1 }, shadow, clip]}>
          {props.model}
        </Text>
      ) : null}
      {props.contextPercent !== null ? <Text style={[small, { marginLeft: 8 }, shadow]}>◔ {props.contextPercent}%</Text> : null}
      {props.subAgents > 0 ? <Count icon="Bot" n={props.subAgents} color={p.muted} shadow={shadow} /> : null}
      {props.backgroundTasks > 0 ? <Count icon="Terminal" n={props.backgroundTasks} color={p.running} shadow={shadow} /> : null}
    </View>
  );
}

function Count({ icon, n, color, shadow }: { icon: string; n: number; color: string; shadow: unknown }) {
  const f = useFont();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 8 }}>
      <Icon name={icon} size={12} color={color} />
      <Text style={[{ color, fontSize: f.xs, fontVariant: ["tabular-nums"] }, shadow as object]}>{n}</Text>
    </View>
  );
}

/** A rule across the card with a centered link on it: folds and unfolds the chat. */
export function ChatToggle({ open, onPress }: { open: boolean; onPress: () => void }) {
  const p: Palette = usePalette();
  const f = useFont();
  const { hovered, props } = useHover();
  const rule = <View style={{ flex: 1, height: 1, backgroundColor: p.border }} />;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
      {rule}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onPress} {...props} hitSlop={6}>
        <Text style={{ color: p.accent, fontSize: f.sm, textDecorationLine: hovered ? "underline" : "none" }}>{open ? "Hide chat" : "Show chat"}</Text>
      </Pressable>
      {rule}
    </View>
  );
}
