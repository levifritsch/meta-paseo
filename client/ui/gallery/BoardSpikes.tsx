// Step 4b.0 spikes, to try inside Paseo: focus-within and column scroll.
// Results go in docs/board-screen.md (4b.0), then this screen is deleted or folded into Spikes.
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { ScrollView, TextInput } from "@getpaseo/plugin/client/ui";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Platform, Text, View } from "react-native";
import { Btn } from "../atoms";
import { createFocusTracker } from "../behaviors";
import { TokensProvider, font, radius, space, usePalette } from "../tokens";

// --- Focus-within ---------------------------------------------------------------------------
// Two ways a card can learn that focus is inside it:
//   bubble: View onFocus/onBlur. React DOM bubbles focus events, so on web one handler on the
//           card sees every input inside. Native View has no such prop.
//   report: each input tells the nearest scope (context). Works anywhere, but only for inputs
//           that opt in, so a plain TextInput or a third-party one is invisible to it.
type Report = { onFocus: () => void; onBlur: () => void };
const ScopeContext = createContext<((id: string) => Report) | null>(null);

function useReport(): Report | null {
  const make = useContext(ScopeContext);
  const id = useRef(Math.random().toString(36).slice(2));
  return useMemo(() => make?.(id.current) ?? null, [make]);
}

function ReportingInput(props: { placeholder: string }) {
  const p = usePalette();
  const report = useReport();
  return (
    <TextInput
      placeholder={props.placeholder}
      placeholderTextColor={p.muted}
      onFocus={report?.onFocus}
      onBlur={report?.onBlur}
      style={{ color: p.text, fontSize: font.md, padding: space.md, borderWidth: 1, borderColor: p.border, borderRadius: radius.md }}
    />
  );
}

function FocusScope(props: { onChange: (inside: boolean) => void; mode: "bubble" | "report"; children: ReactNode }) {
  const tracker = useMemo(() => createFocusTracker(props.onChange), []);
  const make = useMemo(
    () => (id: string): Report => ({ onFocus: () => tracker.enter(id), onBlur: () => tracker.leave(id) }),
    [tracker],
  );
  // `onFocus` and `onBlur` are not in React Native's View props; react-native-web forwards them.
  // `tabIndex: -1` makes the container itself focusable without adding a tab stop, so a click on
  // the card's padding moves focus to the container (still inside) instead of dropping it.
  const bubble =
    props.mode === "bubble"
      ? ({
          onFocus: () => tracker.enter("bubble"),
          onBlur: () => tracker.leave("bubble"),
          tabIndex: -1,
          style: { outlineStyle: "none" },
        } as object)
      : {};
  return (
    <ScopeContext.Provider value={props.mode === "report" ? make : null}>
      <View {...bubble}>{props.children}</View>
    </ScopeContext.Provider>
  );
}

function FocusCard(props: { mode: "bubble" | "report" }) {
  const p = usePalette();
  const [inside, setInside] = useState(false);
  const [changes, setChanges] = useState(0);
  const onChange = (v: boolean) => {
    setInside(v);
    setChanges((n) => n + 1);
  };
  const Input = props.mode === "report" ? ReportingInput : PlainInput;
  return (
    <View style={{ flex: 1, minWidth: 260, gap: space.sm }}>
      <Text style={{ color: p.text, fontSize: font.md, fontWeight: "700" }}>
        {props.mode === "bubble" ? "Bubbling on the card (web)" : "Inputs report to a scope"}
      </Text>
      <FocusScope mode={props.mode} onChange={onChange}>
        <View
          style={{
            gap: space.md,
            padding: space.lg,
            borderRadius: radius.md,
            borderWidth: 2,
            borderColor: inside ? "#3b82f6" : p.border,
            backgroundColor: p.card,
          }}
        >
          <Text style={{ color: inside ? "#3b82f6" : p.muted, fontSize: font.md, fontWeight: "700" }}>
            {inside ? "focus is inside" : "focus is outside"} · {changes} changes
          </Text>
          <Input placeholder="Input A" />
          <Input placeholder="Input B (tab or click between A and B: no flicker)" />
          <Btn label="A button (focusable on web)" variant="ghost" onPress={() => {}} />
        </View>
      </FocusScope>
    </View>
  );
}
function PlainInput(props: { placeholder: string }) {
  const p = usePalette();
  return (
    <TextInput
      placeholder={props.placeholder}
      placeholderTextColor={p.muted}
      style={{ color: p.text, fontSize: font.md, padding: space.md, borderWidth: 1, borderColor: p.border, borderRadius: radius.md }}
    />
  );
}

function FocusDemo() {
  const p = usePalette();
  return (
    <View style={{ gap: space.md }}>
      <Text style={{ color: p.text, fontSize: font.lg, fontWeight: "700" }}>Focus-within</Text>
      <Text style={{ color: p.muted, fontSize: font.sm }}>
        Platform: {Platform.OS}. Click into an input, move between the two, click the button, then click outside. The card
        should light up while focus is inside and the change count should rise by two per visit, not more. The card on the
        left needs web; the one on the right is the fallback that works on native too.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.lg }}>
        <FocusCard mode="bubble" />
        <FocusCard mode="report" />
      </View>
    </View>
  );
}

// --- Column scroll --------------------------------------------------------------------------
// A column of cards with padding. Each card holds its own scrolling chat. Wheel or drag over the
// padding beside a card must scroll the column; over the chat it scrolls the chat.
function ScrollCard(props: { n: number; onChat: () => void }) {
  const p = usePalette();
  return (
    <View style={{ borderRadius: radius.md, borderWidth: 2, borderColor: p.border, backgroundColor: p.card, padding: space.lg, gap: space.md }}>
      <Text style={{ color: p.text, fontSize: font.md, fontWeight: "700" }}>Card {props.n}</Text>
      <View style={{ height: 140, borderWidth: 1, borderColor: p.border, borderRadius: radius.sm }}>
        <ScrollView onScroll={props.onChat} scrollEventThrottle={50} contentContainerStyle={{ padding: space.md }}>
          {Array.from({ length: 24 }, (_, i) => (
            <Text key={i} style={{ color: p.muted, fontSize: font.sm, paddingVertical: 2 }}>
              Chat line {i + 1}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function ScrollDemo() {
  const p = usePalette();
  const [column, setColumn] = useState(0);
  const [chat, setChat] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const last = useRef<"column" | "chat" | null>(null);
  useEffect(() => {
    const which = column + chat === 0 ? null : last.current;
    if (!which) return;
    setLog((l) => (l[0] === which ? l : [which, ...l].slice(0, 6)));
  }, [column, chat]);
  return (
    <View style={{ gap: space.md }}>
      <Text style={{ color: p.text, fontSize: font.lg, fontWeight: "700" }}>Column scroll</Text>
      <Text style={{ color: p.muted, fontSize: font.sm }}>
        Scroll over the gaps and padding around the cards: the column should move. Scroll over a chat box: only that chat
        moves. Then scroll a chat to its end and keep going: note whether the column takes over (chaining). Counts below.
      </Text>
      <Text style={{ color: p.text, fontSize: font.md }}>
        column scrolls: {column} · chat scrolls: {chat} · last: {log.join(" ← ") || "none"}
      </Text>
      <View style={{ flexDirection: "row", gap: space.md }}>
        <Btn
          label="Reset counts"
          variant="ghost"
          onPress={() => {
            setColumn(0);
            setChat(0);
            setLog([]);
            last.current = null;
          }}
        />
      </View>
      <View style={{ height: 460, borderWidth: 1, borderColor: p.border, borderRadius: radius.md, overflow: "hidden" }}>
        <ScrollView
          scrollEventThrottle={50}
          onScroll={() => {
            last.current = "column";
            setColumn((n) => n + 1);
          }}
          style={{ backgroundColor: p.bg }}
          contentContainerStyle={{ padding: space.xl, gap: space.xl }}
        >
          {[1, 2, 3, 4].map((n) => (
            <ScrollCard
              key={n}
              n={n}
              onChat={() => {
                last.current = "chat";
                setChat((c) => c + 1);
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function Demos() {
  const p = usePalette();
  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl * 2 }}>
      <FocusDemo />
      <ScrollDemo />
    </ScrollView>
  );
}

export function BoardSpikes({ theme }: PluginScreenProps) {
  return (
    <TokensProvider theme={theme}>
      <Demos />
    </TokensProvider>
  );
}
