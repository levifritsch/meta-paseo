// One session card, three looks from one component: compact, full and failed (docs/board-screen.md, 4b.3).
// A feature, so it may know Paseo: it archives through the client API.
import { usePaseo } from "@getpaseo/plugin/client";
import { copyText } from "@getpaseo/plugin/client/ui";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Card as CardModel } from "../../../shared/core";
import type { CardExtras } from "../../data/card-map";
import { Dot } from "../atoms";
import { Menu, MenuItem } from "../molecules";
import { usePalette } from "../tokens/context";
import { SESSION_COLORS, font, radius, size, space, stateColor, tint } from "../tokens/tokens";
import { ageLabel, contextPercent, helperSummary } from "./card-view";
import { ChatView } from "./ChatView";

const STATE_LABEL: Record<CardModel["state"], string> = { needs: "Needs you", permission: "Permission", running: "Running", done: "Done", failed: "Failed" };
const WAITING = new Set<CardModel["state"]>(["needs", "permission"]);

export type CardProps = {
  card: CardModel;
  extras?: CardExtras;
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
  const paseo = usePaseo();
  const [menu, setMenu] = useState<"closed" | "main" | "colors">("closed");
  const [showChat, setShowChat] = useState(!WAITING.has(card.state));
  const [actionError, setActionError] = useState<string | null>(null);
  // A new wait folds the chat behind the request; the answer unfolds it again.
  useEffect(() => setShowChat(!WAITING.has(card.state)), [card.state]);

  const color = SESSION_COLORS.find((c) => c.id === props.colorId)?.hex;
  const dot = stateColor(p, card.state);
  const failed = card.state === "failed";
  const waiting = WAITING.has(card.state);
  const ctx = contextPercent(extras?.contextUse);
  const helpers = helperSummary(extras?.subAgents ?? 0, extras?.backgroundTasks ?? 0);
  const close = () => setMenu("closed");
  const run = (action: () => Promise<unknown> | void) => {
    close();
    setActionError(null);
    Promise.resolve(action()).catch((e: unknown) => setActionError(e instanceof Error ? e.message : String(e)));
  };

  const title = (
    <Pressable accessibilityRole={props.onOpenChat ? "link" : "text"} disabled={!props.onOpenChat} onPress={props.onOpenChat} style={{ flex: 1 }}>
      <Text numberOfLines={props.expanded ? 2 : 1} style={{ color: p.text, fontSize: font.md, fontWeight: "600" }}>
        {card.title}
      </Text>
    </Pressable>
  );
  const meta = [props.workspaceName, card.model, ctx === null ? null : `${ctx}% context`].filter(Boolean).join(" · ");

  return (
    <View
      style={{
        backgroundColor: p.card,
        borderRadius: radius.md,
        borderWidth: size.outline,
        borderColor: color ?? p.border,
        padding: space.lg,
        gap: space.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Dot color={dot} />
        {title}
        <Text style={{ color: waiting ? dot : p.muted, fontSize: font.xs }}>
          {waiting ? `${STATE_LABEL[card.state]} · ${ageLabel(card.waitingSince ?? card.lastActivity, props.now)}` : ageLabel(card.lastActivity, props.now)}
        </Text>
        <Menu open={menu !== "closed"} onOpenChange={(o) => setMenu(o ? "main" : "closed")} label="Session menu">
          {menu === "colors" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, padding: space.sm }}>
              {SESSION_COLORS.map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${c.id}`}
                  onPress={() => {
                    props.onChangeColor(c.id);
                    close();
                  }}
                  style={{
                    width: size.swatch,
                    height: size.swatch,
                    borderRadius: radius.pill,
                    backgroundColor: c.hex,
                    borderWidth: c.id === props.colorId ? size.outline : 1,
                    borderColor: c.id === props.colorId ? p.text : p.border,
                  }}
                />
              ))}
            </View>
          ) : (
            <>
              {props.onOpenChat && <MenuItem label="Open chat" onPress={() => { close(); props.onOpenChat?.(); }} />}
              <MenuItem label="Change color" onPress={() => setMenu("colors")} />
              <MenuItem label={props.expanded ? "Collapse" : "Expand"} onPress={() => { close(); props.onToggleExpanded(); }} />
              <MenuItem label="Copy ID" onPress={() => run(() => copyText(card.id))} />
              <MenuItem label="Archive" danger onPress={() => run(() => paseo.agents.ref(card.id).archive())} />
            </>
          )}
        </Menu>
      </View>

      <Text numberOfLines={1} style={{ color: p.muted, fontSize: font.sm }}>
        {props.expanded && card.project ? `${card.project} · ${meta}` : meta}
      </Text>
      {helpers && <Text style={{ color: p.muted, fontSize: font.xs }}>{helpers}</Text>}

      {props.expanded ? (
        <View style={{ gap: space.md }}>
          {waiting && !showChat && (
            <Pressable accessibilityRole="link" onPress={() => setShowChat(true)}>
              <Text style={{ color: p.accent, fontSize: font.sm }}>Show chat</Text>
            </Pressable>
          )}
          <View style={{ height: showChat ? size.chat : undefined }}>
            <ChatView agentId={card.id} hideChat={!showChat} />
          </View>
        </View>
      ) : (
        <Text style={{ color: dot, fontSize: font.sm }}>{STATE_LABEL[card.state]}</Text>
      )}

      {failed && (
        <View style={{ flexDirection: "row", gap: space.md, padding: space.md, borderRadius: radius.sm, backgroundColor: tint(p.error, 0.12) }}>
          <Dot color={p.error} />
          <Text style={{ flex: 1, color: p.error, fontSize: font.sm }}>{extras?.error ?? "The session failed."}</Text>
        </View>
      )}
      {actionError && <Text style={{ color: p.error, fontSize: font.sm }}>{actionError}</Text>}
    </View>
  );
}
