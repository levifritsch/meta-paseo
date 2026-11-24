// One board column: a header over a scrolling stack of cards, or a folded strip of dots.
// No outline or background: the cards carry the color. Cards scroll under a fade from the page.
import { Icon, ScrollView } from "@getpaseo/plugin/client/ui";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView as NativeScrollView, Text, View } from "react-native";
import type { Card as CardModel, CardState, LayoutColumn } from "../../../shared/core";
import type { CardExtras } from "../../data/card-map";
import { Badge, Dot, IconButton, useHover } from "../atoms";
import { Fade, FocusScope, Glide } from "../behaviors";
import { FontScaleProvider, useFont, usePalette } from "../tokens/context";
import { STATE_SHAPE, font, icon, motion, radius, size, space, stateColor, tint } from "../tokens/tokens";
import { Card } from "./Card";
import { columnCounts } from "./column-view";

/** Off for now: scroll to follow a card with focus when it moves (F1). Opening a card still scrolls to it. */
export const FOLLOW_FOCUS = false;

export type ColumnProps = {
  column: LayoutColumn;
  width: number;
  height: number;
  /** The card with focus, which the column follows when it moves (F1). */
  focus: string | null;
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
  const dotsHeight = dots.length * size.stripDotRow + (extra > 0 ? size.stripMore : 0);
  // The name gets what the dots leave, up to a readable length.
  const label = Math.max(size.stripLabelMin, Math.min(size.stripLabelMax, props.height - dotsHeight - size.stripTop - size.stripLabelRoom));
  return (
    <View style={{ paddingHorizontal: size.gutter }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${props.column.title} (${ids.length} sessions)`}
        onPress={props.onPress}
        {...hover}
        style={{ width: size.strip, height: props.height, alignItems: "center", paddingTop: size.stripTop, borderRadius: radius.bubble, overflow: "hidden", backgroundColor: hovered ? tint(p.border, 0.4) : "transparent" }}
      >
        {/* A row as long as the label space, turned a quarter clockwise: it reads top to bottom. */}
        <View style={{ width: size.strip, height: label }}>
          <View style={{ position: "absolute", top: (label - size.stripLabelHeight) / 2, left: (size.strip - label) / 2, width: label, height: size.stripLabelHeight, justifyContent: "center", transform: [{ rotate: "90deg" }] }}>
            <Text numberOfLines={1} style={{ color: p.text, fontSize: font.heading, fontWeight: "700" }}>
              {props.column.title}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: space.pad, alignItems: "center" }}>
          {dots.map((id) => (
            <View key={id} style={{ height: size.stripDotRow, justifyContent: "center" }}>
              <Dot color={stateColor(p, props.states[id] ?? "done")} shape={STATE_SHAPE[props.states[id] ?? "done"]} />
            </View>
          ))}
          {extra > 0 ? <Text style={{ color: p.muted, fontSize: font.xxs, height: size.stripMore }}>+{extra}</Text> : null}
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
  // The column follows a card in two cases, once the cards around it have glided into place (a card
  // mid-slide measures off its spot): a card you open scrolls to the top (S5), and a card with focus
  // that moved scrolls only if it left the view (F1).
  const scroller = useRef<NativeScrollView | null>(null);
  const content = useRef<View | null>(null);
  const cardViews = useRef(new Map<string, View>());
  const reveal = useRef<string | null>(null);
  const prevOrder = useRef(new Map<string, number>());
  const scrollY = useRef(0);
  const viewHeight = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    const order = column.sections.flatMap((s) => s.cards);
    const before = prevOrder.current;
    prevOrder.current = new Map(order.map((c, i) => [c.id, i]));
    let target: { id: string; always: boolean } | null = null;
    const opened = reveal.current;
    if (opened) {
      // Wait until the engine has opened it.
      if (!order.some((c) => c.id === opened && c.expanded)) return;
      reveal.current = null;
      target = { id: opened, always: true };
    } else if (FOLLOW_FOCUS && props.focus && before.size > 0 && prevOrder.current.has(props.focus) && before.get(props.focus) !== prevOrder.current.get(props.focus)) {
      target = { id: props.focus, always: false };
    }
    if (!target) return;
    const { id, always } = target;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const view = cardViews.current.get(id);
      if (!view || !content.current) return;
      view.measureLayout(
        content.current,
        (_x, y, _w, h) => {
          const top = y + space.mid;
          const hidden = top < scrollY.current + size.columnFade || top + h > scrollY.current + viewHeight.current;
          if (always || hidden) scroller.current?.scrollTo({ y: Math.max(0, top - size.columnFade), animated: true });
        },
        () => {},
      );
    }, motion.base + motion.settle);
  }, [column]);
  if (column.folded) return <FoldedColumn column={column} height={props.height} states={props.states} onPress={props.onToggleFold} />;

  const sections = column.sections.filter((s) => s.cards.length > 0);
  return (
    <View style={{ width: props.width + size.gutter * 2, height: props.height }}>
      {/* Headers keep the unscaled sizes: only card text scales. */}
      <FontScaleProvider scale={1}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingTop: space.md, paddingBottom: space.run, paddingHorizontal: size.gutter + space.pad }}>
          <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, color: p.text, fontWeight: "700", fontSize: font.heading }}>
            {column.title}
          </Text>
          <Counts column={column} states={props.states} />
          {/* The new-chat card arrives in step 6. */}
          <IconButton icon="Plus" label={`New chat in ${column.title}`} disabled onPress={() => {}} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Fold ${column.title}`} onPress={props.onToggleFold} hitSlop={6}>
            <Icon name="FoldHorizontal" size={icon.lg} color={p.muted} />
          </Pressable>
        </View>
      </FontScaleProvider>
      <View style={{ flex: 1, minHeight: 0 }}>
        <ScrollView ref={scroller} style={{ flex: 1 }} scrollEventThrottle={64} onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }} onLayout={(e) => { viewHeight.current = e.nativeEvent.layout.height; }} contentContainerStyle={{ paddingTop: space.mid, paddingBottom: space.xl, paddingHorizontal: size.gutter }}>
          <View ref={content} collapsable={false} style={{ gap: space.lg }}>
          {column.count === 0 ? <Text style={{ color: p.muted, fontSize: f.sm, paddingHorizontal: space.pad, paddingTop: space.mid }}>No sessions here.</Text> : null}
          {sections.map((s) => (
            <View key={s.id || "all"} style={{ gap: space.lg }}>
              {s.label ? (
                <Text style={{ color: p.muted, fontSize: f.xxs, letterSpacing: 0.5, textTransform: "uppercase", paddingTop: space.mid, paddingHorizontal: space.pad, marginBottom: -space.sm }}>{s.label}</Text>
              ) : null}
              <Glide gap={space.lg}>
                {s.cards.map(({ id, expanded }) => {
                  const card = props.cards.get(id);
                  if (!card) return null;
                  return (
                    <FocusScope key={id} viewRef={(v) => (v ? cardViews.current.set(id, v) : cardViews.current.delete(id))} onChange={(inside) => props.onFocusChange(id, inside)}>
                      <Card
                        card={card}
                        extras={props.extras[id]}
                        workspaceName={props.showWorkspace ? props.workspaceNames.get(card.workspace) : undefined}
                        now={props.now}
                        expanded={expanded}
                        colorId={props.colors[id]}
                        onToggleExpanded={() => {
                          reveal.current = expanded ? null : id;
                          props.onToggleExpanded(card, expanded);
                        }}
                        onChangeColor={(colorId) => props.onChangeColor(id, colorId)}
                        onOpenChat={props.onOpenChat && (() => props.onOpenChat?.(id))}
                      />
                    </FocusScope>
                  );
                })}
              </Glide>
            </View>
          ))}
          </View>
        </ScrollView>
        <Fade color={p.bg} edge="top" height={size.columnFade} />
      </View>
    </View>
  );
}
