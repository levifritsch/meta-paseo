import { Icon, ScrollView } from "@getpaseo/plugin/client/ui";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { groupBlocks, latestReply, type Turn } from "../../../shared/core";
import { useAgentChat } from "../../data/useAgentChat";
import { useDraft } from "../../state/StoreContext";
import { Btn, LabeledRule } from "../atoms";
import { Fade, useFollowScroll, usePrepend } from "../behaviors";
import { ChatRow, Composer } from "../molecules";
import { useFont, usePalette } from "../tokens/context";
import { chatBackground, icon, opacity, radius, shadow, size, space } from "../tokens/tokens";
import { RequestPanel } from "./requests";

/** Chat contents sit a little closer to the background than the card's own text. */
const CHAT_EMPHASIS = opacity.chat;

/**
 * A session's chat: the last turns, live, with Show earlier, the oldest request, and a message box.
 * It has no frame of its own: a card gives it one. `hideChat` folds the turns away and keeps the
 * request and message box; `trailing` sits after the last turn; `footnote` floats over the bottom
 * fade; `color` is the card's, for the message box. The chat takes `chatHeight`, or the room there is.
 */
export function ChatView({ agentId, hideChat = false, chatHeight, color, trailing, footnote }: { agentId: string; hideChat?: boolean; chatHeight?: number; color?: string; trailing?: ReactNode; footnote?: ReactNode }) {
  const p = usePalette();
  const f = useFont();
  const chat = useAgentChat(agentId);
  const scroll = useFollowScroll();
  const earlier = usePrepend<Turn>(scroll.prepended, space.lg);
  const [draft, setDraft] = useDraft(agentId);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const reply = latestReply(chat.tailTurns);
  // No reply yet: follow the bottom (see follow-scroll.ts).
  useEffect(() => {
    if (!reply) scroll.setReply(null);
  }, [reply?.id]);

  const showEarlier = async () => {
    setLoadingOlder(true);
    try {
      earlier.request(await chat.fetchOlder());
    } finally {
      setLoadingOlder(false);
    }
  };
  const send = (text: string) => {
    setSendError(null);
    chat.send(text).then(
      () => {
        setDraft("");
        scroll.follow();
      },
      (e: unknown) => setSendError(e instanceof Error ? e.message : String(e)),
    );
  };

  const request = chat.requests[0];
  const running = chat.status === "running";
  // Each group is a direct child of the scroll content, so a reply's layout `y` is its place in it.
  const turnRows = (turns: Turn[]) =>
    groupBlocks(turns.flatMap((t) => t.blocks)).map((g) => {
      const first = g.blocks[0]!;
      const isLatest = g.kind === "reply" && first.id === reply?.id;
      return (
        <View
          key={first.id}
          style={{ gap: space.run }}
          onLayout={isLatest ? (e) => scroll.setReply({ top: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height }) : undefined}
        >
          {isLatest && <LabeledRule label="Latest reply" />}
          {g.blocks.map((b) => (
            <ChatRow key={b.id} block={b} />
          ))}
        </View>
      );
    });

  return (
    <View style={{ flex: hideChat || chatHeight ? undefined : 1 }}>
      {!hideChat && (
        <View style={{ flex: chatHeight ? undefined : 1, height: chatHeight, backgroundColor: chatBackground(p) }}>
          <ScrollView {...scroll.scrollProps} contentContainerStyle={{ paddingHorizontal: size.gutter, paddingVertical: size.fade - space.run, gap: space.xl, opacity: CHAT_EMPHASIS }}>
            {chat.hasOlder && (
              <Btn small label={loadingOlder ? "Loading…" : "Show earlier"} variant="ghost" disabled={loadingOlder} onPress={showEarlier} style={{ alignSelf: "center" }} />
            )}
            {earlier.incoming && (
              <View {...earlier.measureProps} pointerEvents="none" style={[earlier.hiddenStyle, { gap: space.xl }]}>
                {turnRows(earlier.incoming)}
              </View>
            )}
            {turnRows(earlier.items)}
            {turnRows(chat.tailTurns)}
            {!chat.ready && !chat.error && <Text style={{ color: p.muted, fontSize: f.sm }}>Loading…</Text>}
            {chat.error && <Text style={{ color: p.error, fontSize: f.sm }}>{chat.error}</Text>}
            {running && <ActivityIndicator size="small" color={p.running} style={{ alignSelf: "flex-start" }} />}
            {trailing}
          </ScrollView>
          <Fade color={p.card} edge="top" height={size.fade} />
          <Fade color={p.card} edge="bottom" height={size.fade} />
          {footnote ? (
            <View pointerEvents="none" style={{ position: "absolute", left: space.xl, right: size.footnoteRight, bottom: space.run, flexDirection: "row", alignItems: "center" }}>
              {footnote}
            </View>
          ) : null}
          {scroll.showJump && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jump to latest"
              onPress={scroll.follow}
              style={({ pressed }) => ({
                position: "absolute",
                right: size.composerInset,
                bottom: size.composerInset,
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
                paddingHorizontal: space.mid,
                paddingVertical: space.tight,
                borderRadius: radius.pill,
                borderWidth: size.hairline,
                borderColor: p.border,
                backgroundColor: p.card,
                opacity: pressed ? opacity.pressed : 1,
                ...shadow.pill,
              })}
            >
              <Icon name="ArrowDown" size={icon.xs} color={p.text} />
              <Text style={{ color: p.text, fontSize: f.xs }}>Jump to latest</Text>
            </Pressable>
          )}
        </View>
      )}
      {request && (
        <View style={{ paddingHorizontal: size.gutter, paddingTop: space.xs, paddingBottom: space.mid }}>
          <RequestPanel
            key={request.id}
            request={request}
            onAction={(actionId) => void chat.act(request.id, actionId)}
            onAnswer={(answers) => request.kind === "question" && void chat.answer(request.id, request.questions, answers)}
          />
        </View>
      )}
      {request && <View style={{ height: size.hairline, backgroundColor: p.border, marginHorizontal: size.gutter, marginBottom: space.mid }} />}
      {sendError && <Text style={{ color: p.error, fontSize: f.sm, paddingHorizontal: size.gutter, paddingBottom: space.md }}>{sendError}</Text>}
      <Composer value={draft} onChange={setDraft} onSend={send} color={color} placeholder={running ? "Message (steers the current turn)" : "Message the agent"} />
    </View>
  );
}
