// Step 4b.1 manual check: the live board data, unstyled. Compare it with what Paseo shows.
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { ScrollView } from "@getpaseo/plugin/client/ui";
import { Text, View } from "react-native";
import { useBoardData } from "../../data/useBoardData";
import { TokensProvider, font, space, usePalette } from "../tokens";

function Data() {
  const p = usePalette();
  const d = useBoardData();
  const line = { color: p.text, fontSize: font.sm, paddingVertical: 2 };
  const ws = new Map(d.workspaces.list.map((w) => [w.id, w.name]));
  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={{ padding: space.xl, gap: space.md }}>
      <Text style={{ color: p.text, fontSize: font.lg, fontWeight: "700" }}>Board data</Text>
      <Text style={line}>
        workspaces: {d.workspaces.loaded ? `${d.workspaces.list.length} loaded` : "NOT LOADED"} · cards: {d.cards.length} · hidden:{" "}
        {d.hidden.length} {d.error ? `· ERROR: ${d.error}` : ""}
      </Text>
      <View>
        {d.cards.map((c) => {
          const x = d.extras[c.id];
          return (
            <Text key={c.id} style={line}>
              [{c.state}] {c.title} · {ws.get(c.workspace) ?? c.workspace} · {c.model ?? "no model"} · sub {x?.subAgents ?? 0} / bg{" "}
              {x?.backgroundTasks ?? 0}
              {c.waitingSince ? ` · waiting ${Math.round((d.now - c.waitingSince) / 60000)}m` : ""}
            </Text>
          );
        })}
      </View>
      <Text style={[line, { fontWeight: "700" }]}>Hidden</Text>
      {d.hidden.map((h) => (
        <Text key={h.id} style={line}>
          {h.kind} {h.id.slice(0, 8)} → parent {h.parentId?.slice(0, 8) ?? "none"} · {h.requests.length} requests
        </Text>
      ))}
    </ScrollView>
  );
}

export function DataCheck({ theme }: PluginScreenProps) {
  return (
    <TokensProvider theme={theme}>
      <Data />
    </TokensProvider>
  );
}
