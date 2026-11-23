// Dev screen: pick any real session and open its chat, to try the chat view in Paseo.
import type { AgentRef, PluginScreenProps } from "@getpaseo/plugin/client";
import { useAgent, useAgents } from "@getpaseo/plugin/client";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Dot } from "../atoms";
import { ChatView } from "../features/ChatView";
import { TokensProvider, font, radius, space, stateColor, usePalette } from "../tokens";

function AgentRow({ agentRef, selected, onPress }: { agentRef: AgentRef; selected: boolean; onPress: () => void }) {
  const p = usePalette();
  const a = useAgent(agentRef);
  if (!a) return null;
  const color = a.status === "running" ? stateColor(p, "running") : a.status === "error" ? stateColor(p, "failed") : stateColor(p, "done");
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: selected ? p.accent : p.border }}
    >
      <Dot color={color} />
      <Text style={{ color: p.text, fontSize: font.sm, flexShrink: 1 }} numberOfLines={1}>
        {a.title ?? a.id}
      </Text>
    </Pressable>
  );
}

function Picker() {
  const p = usePalette();
  const agents = useAgents({ where: (a) => !a.background && !a.parentAgentId, orderBy: ["lastActivityAt", "desc"] });
  const [picked, setPicked] = useState<AgentRef | null>(null);
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: p.bg, padding: space.lg, gap: space.lg }}>
      <ScrollView style={{ width: 240, flexGrow: 0 }} contentContainerStyle={{ gap: space.md }}>
        {agents.map((r) => (
          <AgentRow key={r.key} agentRef={r} selected={picked?.key === r.key} onPress={() => setPicked(r)} />
        ))}
        {agents.length === 0 && <Text style={{ color: p.muted, fontSize: font.sm }}>No sessions.</Text>}
      </ScrollView>
      <View style={{ flex: 1 }}>
        {picked ? <ChatView key={picked.key} agent={picked} /> : <Text style={{ color: p.muted, fontSize: font.sm }}>Pick a session.</Text>}
      </View>
    </View>
  );
}

export function Chats({ theme }: PluginScreenProps) {
  return (
    <TokensProvider theme={theme}>
      <Picker />
    </TokensProvider>
  );
}
