// Dev screen: pick any real session and open its chat, to try the chat view in Paseo.
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { PaseoAgent } from "../../data/paseo-types";
import { useAgentList } from "../../data/useAgentList";
import { Dot } from "../atoms";
import { ChatView } from "../features/ChatView";
import { TokensProvider, font, radius, space, stateColor, usePalette } from "../tokens";

function AgentRow({ agent, selected, onPress }: { agent: PaseoAgent; selected: boolean; onPress: () => void }) {
  const p = usePalette();
  const color = agent.status === "running" ? stateColor(p, "running") : agent.status === "error" ? stateColor(p, "failed") : stateColor(p, "done");
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: selected ? p.accent : p.border }}
    >
      <Dot color={color} />
      <Text style={{ color: p.text, fontSize: font.sm, flexShrink: 1 }} numberOfLines={1}>
        {agent.title ?? agent.id}
      </Text>
    </Pressable>
  );
}

function Picker() {
  const p = usePalette();
  const agents = useAgentList();
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: p.bg, padding: space.lg, gap: space.lg }}>
      <ScrollView style={{ width: 240, flexGrow: 0 }} contentContainerStyle={{ gap: space.md }}>
        {agents.map((a) => (
          <AgentRow key={a.id} agent={a} selected={picked === a.id} onPress={() => setPicked(a.id)} />
        ))}
        {agents.length === 0 && <Text style={{ color: p.muted, fontSize: font.sm }}>No sessions.</Text>}
      </ScrollView>
      <View style={{ flex: 1 }}>
        {picked ? <ChatView key={picked} agentId={picked} /> : <Text style={{ color: p.muted, fontSize: font.sm }}>Pick a session.</Text>}
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
