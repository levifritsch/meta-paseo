// Step 4b.1 manual check: the live board data, unstyled. Compare it with what Paseo shows.
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { ScrollView } from "@getpaseo/plugin/client/ui";
import { Text, View } from "react-native";
import { useBoardData } from "../../data/useBoardData";
import { setCollapse, setView } from "../../state/store";
import { useBoardStore, useStoreSelector } from "../../state/StoreContext";
import { usePersistence } from "../../state/usePersistence";
import { useAssignColors } from "../../state/useColors";
import { Btn } from "../atoms";
import { SESSION_COLORS, TokensProvider, font, space, usePalette } from "../tokens";

function Data() {
  const p = usePalette();
  const d = useBoardData();
  const store = useBoardStore();
  const persist = usePersistence(store);
  useAssignColors(store, SESSION_COLORS, d);
  const saved = useStoreSelector((s) => s.persisted);
  const hexes = new Map(SESSION_COLORS.map((c) => [c.id, c.hex]));
  const first = d.cards[0];
  const line = { color: p.text, fontSize: font.sm, paddingVertical: 2 };
  const ws = new Map(d.workspaces.list.map((w) => [w.id, w.name]));
  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={{ padding: space.xl, gap: space.md }}>
      <Text style={{ color: p.text, fontSize: font.lg, fontWeight: "700" }}>Board data</Text>
      <Text style={line}>
        workspaces: {d.workspaces.loaded ? `${d.workspaces.list.length} loaded` : "NOT LOADED"} · cards: {d.cards.length} · hidden:{" "}
        {d.hidden.length} {d.error ? `· ERROR: ${d.error}` : ""}
      </Text>
      <Text style={[line, { fontWeight: "700" }]}>Persistence (4b.2)</Text>
      <Text style={line}>
        definition (this client): {saved.def.ready ? (saved.def.ok ? "ready" : "INVALID, read-only") : "loading"} · view {saved.def.value.view.columnWidth}px /{" "}
        {saved.def.value.view.fontScale}x · {persist.def.saving ? "saving" : "idle"} {persist.def.saveError ?? ""}
      </Text>
      <Text style={line}>
        sessions (this host): {saved.sessions.ready ? (saved.sessions.ok ? "ready" : "INVALID, read-only") : "loading"} ·{" "}
        {Object.keys(saved.sessions.value.colors).length} colors · {Object.keys(saved.sessions.value.collapsed).length} collapsed ·{" "}
        {persist.sessions.saving ? "saving" : "idle"} {persist.sessions.saveError ?? ""}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        <Btn label="Font scale +0.1" onPress={() => setView(store, { fontScale: Math.min(1.5, Math.round((saved.def.value.view.fontScale + 0.1) * 10) / 10) })} />
        <Btn label="Font scale -0.1" variant="ghost" onPress={() => setView(store, { fontScale: Math.max(0.8, Math.round((saved.def.value.view.fontScale - 0.1) * 10) / 10) })} />
        <Btn
          label="Hand-collapse the first card"
          variant="ghost"
          disabled={!first}
          onPress={() => first && setCollapse(store, first.id, { state: first.state, activity: first.lastActivity })}
        />
        <Btn label="Clear collapses" variant="ghost" onPress={() => Object.keys(saved.sessions.value.collapsed).forEach((id) => setCollapse(store, id, null))} />
      </View>
      <View>
        {d.cards.map((c) => {
          const x = d.extras[c.id];
          return (
            <Text key={c.id} style={line}>
              {saved.sessions.value.colors[c.id] ? `(${saved.sessions.value.colors[c.id]} ${hexes.get(saved.sessions.value.colors[c.id]!) ?? ""}) ` : "(no color) "}
              {saved.sessions.value.collapsed[c.id] ? "[collapsed] " : ""}[{c.state}] {c.title} · {ws.get(c.workspace) ?? c.workspace} · {c.model ?? "no model"} · sub {x?.subAgents ?? 0} / bg{" "}
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
