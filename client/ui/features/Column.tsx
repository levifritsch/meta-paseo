// One board column: a header over a scrolling stack of cards, or a folded strip of dots.
// No outline or background: the cards carry the color. Cards scroll under a fade from the page.
import { Icon, ScrollView } from "@getpaseo/plugin/client/ui";
import { Pressable, Text, View } from "react-native";
import type { Card as CardModel, CardState, LayoutColumn } from "../../../shared/core";
import type { CardExtras } from "../../data/card-map";
import { Badge, IconButton, useHover } from "../atoms";
import { Fade, FocusScope, Glide } from "../behaviors";
import { FontScaleProvider, useFont, usePalette } from "../tokens/context";
import { font, size, space, stateColor, tint } from "../tokens/tokens";
import { Card } from "./Card";
import { columnCounts } from "./column-view";

export type ColumnProps = {
  column: LayoutColumn;
  width: number;
  height: number;
  cards: ReadonlyMap<string, CardModel>;
  states: Readonly<Record<string, CardState>>;
  extras: Readonly<Record<string, CardExtras>>;
  workspaceNames: ReadonlyMap<string, string>;
  colors: Readonly<Record<string, string>>;
  now: number;
  /** Status columns span workspaces, so their cards name the workspace (K3). */
  showWorkspace: boolean;
  onToggleFold: () => void;
  onFocusChange: (cardId: string, inside: boolean) => void;
  onToggleExpanded: (card: CardModel, expanded: boolean) => void;
  onChangeColor: (cardId: string, colorId: string) => void;
  onOpenChat?: (cardId: string) => void;
};

/** A folded column: its name reading top to bottom, then a dot per session in its state color. */
function FoldedColumn(props: { column: LayoutColumn; height: number; states: Readonly<Record<string, CardState>>; onPress: () => void }) {
  const p = usePalette();
  const { hovered, props: hover } = useHover();
  const ids = props.column.sections.flatMap((s) => s.cards.map((c) => c.id));
  const dots = ids.slice(0, size.stripDots);
  const extra = ids.length - dots.length;
  const dotsHeight = dots.length * 15 + (extra > 0 ? 16 : 0);
  // The name gets what the dots leave, up to a readable length.
  const label = Math.max(40, Math.min(260, props.height - dotsHeight - size.stripTop - 30));
  return (
    <View style={{ paddingHorizontal: size.gutter }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${props.column.title} (${ids.length} sessions)`}
        onPress={props.onPress}
        {...hover}
        style={{ width: size.strip, height: props.height, alignItems: "center", paddingTop: size.stripTop, borderRadius: 10, overflow: "hidden", backgroundColor: hovered ? tint(p.border, 0.4) : "transparent" }}
      >
        {/* A row as long as the label space, turned a quarter clockwise: it reads top to bottom. */}
        <View style={{ width: size.strip, height: label }}>
          <View style={{ position: "absolute", top: label / 2 - 13, left: (size.strip - label) / 2, width: label, height: 26, justifyContent: "center", transform: [{ rotate: "90deg" }] }}>
            <Text numberOfLines={1} style={{ color: p.text, fontSize: font.heading, fontWeight: "700" }}>
              {props.column.title}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 14, alignItems: "center" }}>
          {dots.map((id) => (
            <View key={id} style={{ height: 15, justifyContent: "center" }}>
              <View style={{ width: size.dot, height: size.dot, borderRadius: size.dot / 2, backgroundColor: stateColor(p, props.states[id] ?? "done") }} />
            </View>
          ))}
          {extra > 0 ? <Text style={{ color: p.muted, fontSize: font.xxs, height: 16 }}>+{extra}</Text> : null}
        </View>
      </Pressable>
    </View>
  );
}

function Counts({ column, states }: { column: LayoutColumn; states: Readonly<Record<string, CardState>> }) {
  const p = usePalette();
  const counts = columnCounts(column, states);
  if (counts.kind === "total") return <Badge count={counts.total} color={p.muted} />;
  return (
    <View style={{ flexDirection: "row", gap: space.sm }}>
      {counts.counts.map((c) => (
        <Badge key={c.state} count={c.count} color={stateColor(p, c.state)} />
      ))}
    </View>
  );
}

export function Column(props: ColumnProps) {
  const p = usePalette();
  const f = useFont();
  const { column } = props;
  if (column.folded) return <FoldedColumn column={column} height={props.height} states={props.states} onPress={props.onToggleFold} />;

  const sections = column.sections.filter((s) => s.cards.length > 0);
  return (
    <View style={{ width: props.width + size.gutter * 2, height: props.height }}>
      {/* Headers keep the unscaled sizes: only card text scales. */}
      <FontScaleProvider scale={1}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingTop: 8, paddingBottom: 6, paddingHorizontal: size.gutter + 14 }}>
          <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, color: p.text, fontWeight: "700", fontSize: font.heading }}>
            {column.title}
          </Text>
          <Counts column={column} states={props.states} />
          {/* The new-chat card arrives in step 6. */}
          <IconButton icon="Plus" label={`New chat in ${column.title}`} disabled onPress={() => {}} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Fold ${column.title}`} onPress={props.onToggleFold} hitSlop={6}>
            <Icon name="FoldHorizontal" size={15} color={p.muted} />
          </Pressable>
        </View>
      </FontScaleProvider>
      <View style={{ flex: 1, minHeight: 0 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 10, paddingBottom: 16, paddingHorizontal: size.gutter, gap: 12 }}>
          {column.count === 0 ? <Text style={{ color: p.muted, fontSize: f.sm, paddingHorizontal: 14, paddingTop: 10 }}>No sessions here.</Text> : null}
          {sections.map((s) => (
            <View key={s.id || "all"} style={{ gap: 12 }}>
              {s.label ? (
                <Text style={{ color: p.muted, fontSize: f.xxs, letterSpacing: 0.5, textTransform: "uppercase", paddingTop: 10, paddingHorizontal: 14, marginBottom: -4 }}>{s.label}</Text>
              ) : null}
              <Glide gap={12}>
                {s.cards.map(({ id, expanded }) => {
                  const card = props.cards.get(id);
                  if (!card) return null;
                  return (
                    <FocusScope key={id} onChange={(inside) => props.onFocusChange(id, inside)}>
                      <Card
                        card={card}
                        extras={props.extras[id]}
                        workspaceName={props.showWorkspace ? props.workspaceNames.get(card.workspace) : undefined}
                        now={props.now}
                        expanded={expanded}
                        colorId={props.colors[id]}
                        onToggleExpanded={() => props.onToggleExpanded(card, expanded)}
                        onChangeColor={(colorId) => props.onChangeColor(id, colorId)}
                        onOpenChat={props.onOpenChat && (() => props.onOpenChat?.(id))}
                      />
                    </FocusScope>
                  );
                })}
              </Glide>
            </View>
          ))}
        </ScrollView>
        <Fade color={p.bg} edge="top" height={20} />
      </View>
    </View>
  );
}
