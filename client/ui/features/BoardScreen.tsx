// The Board screen: top bar, then columns edge to edge. A feature, so it knows Paseo.
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { ScrollView } from "@getpaseo/plugin/client/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView as NativeScrollView, Text, View } from "react-native";
import { groupingOf, type Card as CardModel } from "../../../shared/core";
import { useBoardData } from "../../data/useBoardData";
import { setCollapse, setColor, setExpanded, setFocus, setFolded, setGrouping, setView } from "../../state/store";
import { useBoardStore, useStoreSelector } from "../../state/StoreContext";
import { useBoard } from "../../state/useBoard";
import { useAssignColors } from "../../state/useColors";
import { usePersistence } from "../../state/usePersistence";
import { Segmented } from "../atoms";
import { FontScaleProvider, TokensProvider, usePalette } from "../tokens";
import { SESSION_COLORS, font, size, space, tint } from "../tokens/tokens";
import { Column, FOLLOW_FOCUS } from "./Column";
import { ViewOptions } from "./ViewOptions";

const GROUPINGS = [
  { value: "workspace", label: "Workspaces" },
  { value: "status", label: "Status" },
] as const;

/** Space above and below the columns. */
const BOARD_PAD_Y = space.lg;

function Board({ openChat }: { openChat?: (agentId: string) => void }) {
  const p = usePalette();
  const store = useBoardStore();
  const data = useBoardData();
  const persist = usePersistence(store);
  useAssignColors(store, SESSION_COLORS, data);
  const focus = useStoreSelector((s) => s.ephemeral.focus);
  const def = useStoreSelector((s) => s.persisted.def);
  const sessions = useStoreSelector((s) => s.persisted.sessions);
  const { layout } = useBoard(store, data);

  const cards = useMemo(() => new Map(data.cards.map((c) => [c.id, c])), [data.cards]);
  const names = useMemo(() => new Map(data.workspaces.list.map((w) => [w.id, w.name])), [data.workspaces.list]);
  const grouping = groupingOf(def.value);
  const { columnWidth, fontScale } = def.value.view;

  const onFocusChange = (id: string, inside: boolean) => {
    // Leaving clears focus only if this card still holds it, so a hop between cards is not undone.
    if (inside) setFocus(store, id);
    else if (store.get().ephemeral.focus === id) setFocus(store, null);
  };
  const onToggleExpanded = (card: CardModel, expanded: boolean) => {
    if (expanded) {
      setExpanded(store, card.id, false);
      setCollapse(store, card.id, { state: card.state, activity: card.lastActivity });
    } else {
      setCollapse(store, card.id, null);
      setExpanded(store, card.id, true);
    }
  };

  const ready = def.ready && sessions.ready;
  const status = data.error
    ? { text: `Could not load sessions: ${data.error}`, error: true }
    : !data.loaded || !ready
      ? { text: "Loading…", error: false }
      : data.cards.length === 0
        ? { text: "No sessions yet.", error: false }
        : null;
  const readOnly = (!def.ok && def.ready) || (!sessions.ok && sessions.ready);
  const saveError = persist.def.saveError ?? persist.sessions.saveError;

  const [boardHeight, setBoardHeight] = useState(0);
  // A focused card that moves to another column brings that column into view (F1).
  const boardScroll = useRef<NativeScrollView | null>(null);
  const scrollX = useRef(0);
  const boardWidth = useRef(0);
  const columnBox = useRef(new Map<string, { x: number; w: number }>());
  const focusColumn = useRef<string | null>(null);
  const focusColumnId = focus ? layout?.columns.find((c) => c.sections.some((s) => s.cards.some((k) => k.id === focus)))?.id ?? null : null;
  useEffect(() => {
    const was = focusColumn.current;
    focusColumn.current = focusColumnId;
    if (!FOLLOW_FOCUS || !focusColumnId || !was || was === focusColumnId) return;
    const box = columnBox.current.get(focusColumnId);
    if (!box) return;
    if (box.x < scrollX.current || box.x + box.w > scrollX.current + boardWidth.current) boardScroll.current?.scrollTo({ x: Math.max(0, box.x - space.xl), animated: true });
  }, [focusColumnId]);
  const columnHeight = Math.max(0, boardHeight - 2 * BOARD_PAD_Y);
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      {/* Three equal-weight zones keep the grouping switch in the middle, whatever sits either side. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.mid, paddingHorizontal: space.pad, paddingVertical: space.mid, borderBottomWidth: size.hairline, borderBottomColor: p.border }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.mid }}>
          {readOnly && <Text style={{ color: p.question, fontSize: font.sm }}>Saved layout is from a newer version: changes are not saved.</Text>}
          {saveError && <Text style={{ color: p.error, fontSize: font.sm }}>Could not save: {saveError}</Text>}
        </View>
        {grouping === "custom" ? (
          <Text style={{ color: p.muted, fontSize: font.sm }}>Custom view</Text>
        ) : (
          <Segmented label="Columns by" options={GROUPINGS} value={grouping} onChange={(g) => setGrouping(store, g)} />
        )}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: space.md }}>
          <ViewOptions
            columnWidth={columnWidth}
            fontScale={fontScale}
            onColumnWidth={(v) => setView(store, { columnWidth: v })}
            onFontScale={(v) => setView(store, { fontScale: v })}
          />
        </View>
      </View>
      {status && (
        <View style={{ paddingHorizontal: space.pad, paddingVertical: space.run, backgroundColor: status.error ? tint(p.error, 0.12) : undefined }}>
          <Text style={{ color: status.error ? p.error : p.muted, fontSize: status.error ? font.sm : font.md }}>{status.text}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }} onLayout={(e) => { setBoardHeight(e.nativeEvent.layout.height); boardWidth.current = e.nativeEvent.layout.width; }}>
        {layout && data.loaded && ready && (
          <FontScaleProvider scale={fontScale}>
            <ScrollView ref={boardScroll} horizontal scrollEventThrottle={64} onScroll={(e) => { scrollX.current = e.nativeEvent.contentOffset.x; }} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.xl - size.gutter, paddingVertical: BOARD_PAD_Y, alignItems: "flex-start" }}>
              {layout.columns.map((column) => (
                <View key={column.id} onLayout={(e) => columnBox.current.set(column.id, { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width })}>
                <Column
                  column={column}
                  focus={focus}
                  width={columnWidth}
                  height={columnHeight}
                  cards={cards}
                  states={layout.states}
                  extras={data.extras}
                  workspaceNames={names}
                  colors={sessions.value.colors}
                  now={data.now}
                  showWorkspace={!column.generated}
                  onToggleFold={() => setFolded(store, column.id, !column.folded)}
                  onFocusChange={onFocusChange}
                  onToggleExpanded={onToggleExpanded}
                  onChangeColor={(id, colorId) => setColor(store, id, colorId)}
                  onOpenChat={openChat}
                />
                </View>
              ))}
            </ScrollView>
          </FontScaleProvider>
        )}
      </View>
    </View>
  );
}

export function BoardScreen({ theme, navigation }: PluginScreenProps) {
  return (
    <TokensProvider theme={theme}>
      <Board openChat={navigation?.openAgent && ((agentId) => navigation.openAgent({ agentId }))} />
    </TokensProvider>
  );
}
