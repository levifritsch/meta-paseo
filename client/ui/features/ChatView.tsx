import { ScrollView } from "@getpaseo/plugin/client/ui";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { latestReply, type Turn } from "../../../shared/core";
import { useAgentChat } from "../../data/useAgentChat";
import { useDraft } from "../../state/StoreContext";
import { Btn } from "../atoms";
import { useFollowScroll, usePrepend } from "../behaviors";
import { ChatRow, Composer } from "../molecules";
import { usePalette } from "../tokens/context";
import { font, radius, space } from "../tokens/tokens";
import { RequestPanel } from "./requests";

/** A session's chat: the last turns, live, with Show earlier, the oldest request, and a composer. */
export function ChatView({ agentId }: { agentId: string }) {
  const p = usePalette();
  const chat = useAgentChat(agentId);
  const scroll = useFollowScroll();
  const earlier = usePrepend<Turn>(scroll.prepended, space.lg);
  const [draft, setDraft] = useDraft(agentId);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const reply = latestReply(chat.tailTurns);
  // No reply yet: follow the bottom (see follow-scroll.ts).
  useEffect(() => {
    if (!reply) scroll.setReplyTop(null);
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
  const turnRows = (turns: Turn[]) =>
    turns.flatMap((t) => t.blocks).map((b) => (
      <View key={b.id} onLayout={b.id === reply?.id ? (e) => scroll.setReplyTop(e.nativeEvent.layout.y) : undefined}>
        <ChatRow block={b} />
      </View>
    ));

  return (
    <View style={{ flex: 1, backgroundColor: p.card, borderRadius: radius.md, borderWidth: 1, borderColor: p.border, overflow: "hidden" }}>
      <View style={{ flex: 1 }}>
        <ScrollView {...scroll.scrollProps} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
          {chat.hasOlder && (
            <Btn label={loadingOlder ? "Loading…" : "Show earlier"} variant="ghost" disabled={loadingOlder} onPress={showEarlier} style={{ alignSelf: "center" }} />
          )}
          {earlier.incoming && (
            <View {...earlier.measureProps} pointerEvents="none" style={[earlier.hiddenStyle, { gap: space.lg }]}>
              {turnRows(earlier.incoming)}
            </View>
          )}
          {turnRows(earlier.items)}
          {turnRows(chat.tailTurns)}
          {!chat.ready && !chat.error && <ActivityIndicator color={p.muted} />}
          {chat.error && <Text style={{ color: p.error, fontSize: font.sm }}>{chat.error}</Text>}
          {running && <ActivityIndicator color={p.running} style={{ alignSelf: "flex-start" }} />}
        </ScrollView>
        {!scroll.following && (
          <View style={{ position: "absolute", right: space.lg, bottom: space.lg }}>
            <Btn label="Jump to latest" onPress={scroll.follow} />
          </View>
        )}
      </View>
      <View style={{ padding: space.lg, gap: space.md, borderTopWidth: 1, borderTopColor: p.border }}>
        {request && (
          <RequestPanel
            key={request.id}
            request={request}
            onAction={(actionId) => void chat.act(request.id, actionId)}
            onAnswer={(answers) => request.kind === "question" && void chat.answer(request.id, request.questions, answers)}
          />
        )}
        {sendError && <Text style={{ color: p.error, fontSize: font.sm }}>{sendError}</Text>}
        <Composer value={draft} onChange={setDraft} onSend={send} placeholder={running ? "Message (steers the current turn)" : "Message"} />
      </View>
    </View>
  );
}
