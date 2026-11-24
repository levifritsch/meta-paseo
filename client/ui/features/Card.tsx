// One session card, from one component: compact, full, and failed (the full card with an error
// after the chat). A feature, so it may know Paseo: it archives through the client API.
import { usePaseo } from "@getpaseo/plugin/client";
import { copyText, useToast } from "@getpaseo/plugin/client/ui";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Card as CardModel } from "../../../shared/core";
import type { CardExtras } from "../../data/card-map";
import { Dot, IconButton } from "../atoms";
import { ColorPicker, ErrorBox, MenuButton, usePopover, type Anchor, type MenuRow } from "../molecules";
import { useFont, usePalette } from "../tokens/context";
import { SESSION_COLORS, innerGlow, leading, radius, share, size, space, stateColor, tint } from "../tokens/tokens";
import { ageLabel, compactMeta, contextPercent, joinMeta } from "./card-view";
import { ChatToggle, MetaTags, TitleLink } from "./card-parts";
import { ChatView } from "./ChatView";

const WAITING = new Set<CardModel["state"]>(["needs", "permission"]);
/** The full card's bottom corners sit concentric with the message box and the round send button. */
const CORNER_LEFT = radius.field + size.composerInset + size.hairline;
const CORNER_RIGHT = size.input / 2 + size.composerInset + size.hairline;

export type CardProps = {
  card: CardModel;
  extras?: CardExtras;
  /** Shown in status columns, which span workspaces. */
  workspaceName?: string;
  now: number;
  /** The engine's call: a full card shows its chat, a compact one a summary. */
  expanded: boolean;
  /** The session's color id from `SESSION_COLORS`, when it has one. */
  colorId?: string;
  onToggleExpanded: () => void;
  onChangeColor: (colorId: string) => void;
  /** Absent on a host with no navigation: the open-chat actions hide. */
  onOpenChat?: () => void;
};

export function Card(props: CardProps) {
  const { card, extras } = props;
  const p = usePalette();
  const f = useFont();
  const paseo = usePaseo();
  const toast = useToast();
  const colorPop = usePopover();
  const dot = stateColor(p, card.state);
  const outline = SESSION_COLORS.find((c) => c.id === props.colorId)?.hex ?? p.border;
  const waiting = WAITING.has(card.state);
  const running = card.state === "running";
  const failed = card.state === "failed";
  const ago = ageLabel(card.waitingSince ?? card.lastActivity, props.now);
  const tags = { model: card.model, contextPercent: contextPercent(extras?.contextUse), subAgents: extras?.subAgents ?? 0, backgroundTasks: extras?.backgroundTasks ?? 0 };

  // A new wait folds the chat behind its request; answering unfolds it again.
  const [chatOpen, setChatOpen] = useState(!waiting);
  useEffect(() => setChatOpen(!waiting), [waiting]);

  const attempt = (action: () => Promise<unknown> | void) => () => {
    Promise.resolve(action()).catch((e: unknown) => toast.error(e instanceof Error ? e.message : String(e)));
  };
  const open = props.onOpenChat;
  const rows: MenuRow[][] = [
    [
      ...(open ? [{ key: "open", label: "Open chat", icon: "ExternalLink", onPress: () => open() }] : []),
      { key: "color", label: "Change color", icon: "Palette", onPress: (at: Anchor) => colorPop.setAt(at) },
      // A permission card stays open: there is nothing to collapse.
      ...(card.state === "permission" ? [] : [{ key: "expand", label: props.expanded ? "Collapse card" : "Expand card", icon: props.expanded ? "Minimize2" : "Maximize2", onPress: props.onToggleExpanded }]),
      { key: "copy", label: "Copy session ID", icon: "Copy", onPress: attempt(() => copyText(card.id)) },
    ],
    [{ key: "archive", label: "Archive", icon: "Archive", danger: true, confirm: "Click again to archive", onPress: attempt(() => paseo.agents.ref(card.id).archive()) }],
  ];
  const menu = <MenuButton label="Session menu" groups={rows} />;
  const picker = <ColorPicker at={colorPop.at} current={props.colorId} onPick={props.onChangeColor} onClose={colorPop.close} />;
  const status = <Dot color={dot} ring={running} alert={failed} />;

  if (!props.expanded) {
    return (
      <Pressable
        accessibilityLabel={`Expand ${card.title}`}
        onPress={props.onToggleExpanded}
        style={({ pressed }) => ({
          // The diagonal resize cursor says the card grows when pressed, without hinting at a re-order.
          ...({ cursor: "nesw-resize" } as object),
          flexDirection: "row",
          alignItems: "center",
          gap: space.cozy,
          paddingVertical: space.lg,
          paddingLeft: space.pad,
          paddingRight: space.md,
          borderRadius: radius.card,
          borderWidth: size.hairline,
          borderColor: outline,
          boxShadow: innerGlow(outline),
          backgroundColor: pressed ? tint(outline, 0.08) : p.card,
        })}
      >
        {status}
        <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
          <TitleLink title={card.title} lines={1} onOpen={open} style={{ fontSize: f.lg, fontWeight: "600" }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.run, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: p.muted, fontSize: f.sm, flexShrink: 1, overflow: "hidden" }}>
              {joinMeta(props.workspaceName, compactMeta(card.state, ago))}
            </Text>
            <View style={{ flex: 1 }} />
            <View style={{ maxWidth: share.meta, flexShrink: 0 }}>
              <MetaTags {...tags} />
            </View>
          </View>
        </View>
        {menu}
        {picker}
      </Pressable>
    );
  }

  return (
    <View
      style={{
        borderRadius: radius.card,
        borderBottomLeftRadius: CORNER_LEFT,
        borderBottomRightRadius: CORNER_RIGHT,
        borderWidth: size.hairline,
        borderColor: outline,
        backgroundColor: p.card,
        overflow: "hidden",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.mid, paddingTop: space.pad, paddingLeft: space.xl, paddingRight: space.mid }}>
        <View style={{ marginTop: running ? space.sm : space.run }}>{status}</View>
        <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
          <TitleLink title={card.title} lines={2} onOpen={open} style={{ fontSize: f.title, fontWeight: "700", lineHeight: f.title * leading.title }} />
          <Text numberOfLines={1} style={{ color: p.muted, fontSize: f.sm, overflow: "hidden" }}>
            {joinMeta(props.workspaceName, ago)}
          </Text>
          {card.project && card.project !== props.workspaceName ? (
            <Text numberOfLines={1} style={{ color: p.muted, fontSize: f.sm, overflow: "hidden" }}>
              {card.project}
            </Text>
          ) : null}
        </View>
        {card.state === "permission" ? null : <IconButton icon="Minimize2" label="Collapse card" onPress={props.onToggleExpanded} />}
        {menu}
      </View>
      {waiting ? <ChatToggle open={chatOpen} onPress={() => setChatOpen((v) => !v)} /> : null}
      <ChatView
        agentId={card.id}
        hideChat={!chatOpen}
        chatHeight={size.chat}
        color={props.colorId ? outline : undefined}
        trailing={failed && extras?.error ? <ErrorBox text={extras.error} /> : null}
        footnote={waiting ? null : <MetaTags {...tags} over />}
      />
      {/* Over everything: the chat's own background would hide the glow at the sides. */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.card, borderBottomLeftRadius: CORNER_LEFT, borderBottomRightRadius: CORNER_RIGHT, boxShadow: innerGlow(outline) } as object}
      />
      {picker}
    </View>
  );
}
