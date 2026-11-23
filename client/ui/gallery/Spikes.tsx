// Live demos for the two risky behaviors, to try inside Paseo: follow-scroll and Glide.
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { ScrollView } from "@getpaseo/plugin/client/ui";
import { Fragment, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Btn, Switch } from "../atoms";
import { Glide, useFollowScroll, usePrepend } from "../behaviors";
import { SESSION_COLORS, TokensProvider, font, radius, space, usePalette } from "../tokens";

type Turn = { id: number; prompt: string; reply: string[] };
const seed = (from: number, count: number): Turn[] =>
  Array.from({ length: count }, (_, i) => ({
    id: from + i,
    prompt: `Prompt ${from + i}`,
    reply: Array.from({ length: 4 }, (_, j) => `Reply line ${j + 1} of turn ${from + i}`),
  }));

function FollowDemo() {
  const p = usePalette();
  const chat = useFollowScroll();
  const [turns, setTurns] = useState<Turn[]>(() => seed(10, 2));
  const earlier = usePrepend<Turn>(chat.prepended, space.lg);
  const [auto, setAuto] = useState(false);
  const nextId = useRef(12);
  const nextEarlier = useRef(9);

  const addLine = () =>
    setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, reply: [...x.reply, `Streamed line ${x.reply.length + 1}`] } : x)));
  const addPrompt = () => {
    setTurns((t) => [...t, { id: nextId.current, prompt: `Prompt ${nextId.current}`, reply: [] }]);
    nextId.current += 1;
    chat.follow();
  };
  const showEarlier = () => {
    earlier.request(seed(nextEarlier.current - 2, 3));
    nextEarlier.current -= 3;
  };

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(addLine, 700);
    return () => clearInterval(t);
  }, [auto]);

  const last = turns[turns.length - 1];
  // A new prompt has no reply yet, so the target falls back to the bottom.
  useEffect(() => {
    if (last && last.reply.length === 0) chat.setReplyTop(null);
  }, [last?.id, last?.reply.length]);
  const row = { color: p.text, fontSize: font.md, paddingVertical: space.sm };
  return (
    <View style={{ gap: space.md }}>
      <Text style={{ color: p.text, fontSize: font.lg, fontWeight: "700" }}>Follow scroll</Text>
      <Text style={{ color: p.muted, fontSize: font.sm }}>
        Follows the top of the latest reply. Scroll away and it stops (jump button appears). New prompt or jump follows
        again. Show earlier must not move what you are looking at.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, alignItems: "center" }}>
        <Btn label="Stream a line" onPress={addLine} />
        <Btn label="New prompt" onPress={addPrompt} />
        <Btn label="Show earlier" variant="ghost" onPress={showEarlier} />
        <Switch label="Auto-stream" value={auto} onValueChange={setAuto} />
        <Text style={{ color: p.muted, fontSize: font.sm }}>{chat.following ? "following" : "detached"}</Text>
      </View>
      <View style={{ height: 280, borderWidth: 1, borderColor: p.border, borderRadius: radius.md, overflow: "hidden" }}>
        <ScrollView {...chat.scrollProps} style={{ backgroundColor: p.card }} contentContainerStyle={{ padding: space.lg }}>
          {earlier.incoming && (
            <View {...earlier.measureProps} pointerEvents="none" style={earlier.hiddenStyle}>
              {earlier.incoming.map((t) => (
                <Turn key={t.id} turn={t} />
              ))}
            </View>
          )}
          {earlier.items.map((t) => (
            <Turn key={t.id} turn={t} />
          ))}
          {turns.map((t) => (
            <Fragment key={t.id}>
              <Text style={[row, { fontWeight: "700" }]}>{t.prompt}</Text>
              {t.reply.length > 0 && (
                // A direct child of the scroll content, so its y is the reply's top in content space.
                <View onLayout={t === last ? (e) => chat.setReplyTop(e.nativeEvent.layout.y) : undefined}>
                  {t.reply.map((line, i) => (
                    <Text key={i} style={row}>
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </Fragment>
          ))}
        </ScrollView>
        {!chat.following && (
          <View style={{ position: "absolute", right: space.lg, bottom: space.lg }}>
            <Btn label="Jump to latest" onPress={chat.follow} />
          </View>
        )}
      </View>
    </View>
  );
}
function Turn({ turn }: { turn: Turn }) {
  const p = usePalette();
  return (
    <View>
      <Text style={{ color: p.text, fontSize: font.md, fontWeight: "700", paddingVertical: space.sm }}>{turn.prompt}</Text>
      {turn.reply.map((l, i) => (
        <Text key={i} style={{ color: p.text, fontSize: font.md, paddingVertical: space.sm }}>
          {l}
        </Text>
      ))}
    </View>
  );
}

function GlideDemo() {
  const p = usePalette();
  const [items, setItems] = useState(() => SESSION_COLORS.slice(0, 5).map((c, i) => ({ id: i, hex: c.hex, open: false })));
  const next = useRef(5);
  const shuffle = () => setItems((xs) => [...xs].sort(() => Math.random() - 0.5));
  const add = () => {
    const i = next.current++;
    setItems((xs) => [{ id: i, hex: SESSION_COLORS[i % SESSION_COLORS.length]!.hex, open: false }, ...xs]);
  };
  const remove = () => setItems((xs) => xs.slice(1));
  const toggle = (id: number) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, open: !x.open } : x)));
  return (
    <View style={{ gap: space.md }}>
      <Text style={{ color: p.text, fontSize: font.lg, fontWeight: "700" }}>Glide</Text>
      <Text style={{ color: p.muted, fontSize: font.sm }}>
        Cards slide to their new place and a joiner fades in. Tap a card to open or close it: the ones below glide. Nothing
        animates at load, or under reduced motion.
      </Text>
      <View style={{ flexDirection: "row", gap: space.md }}>
        <Btn label="Shuffle" onPress={shuffle} />
        <Btn label="Add on top" onPress={add} />
        <Btn label="Remove first" variant="danger" onPress={remove} />
      </View>
      <View>
        <Glide gap={space.md}>
          {items.map((it) => (
            <View
              key={it.id}
              onTouchEnd={() => toggle(it.id)}
              style={{ height: it.open ? 120 : 44, borderRadius: radius.md, borderWidth: 2, borderColor: it.hex, backgroundColor: p.card, padding: space.lg }}
            >
              <Text style={{ color: p.text, fontSize: font.md }}>Card {it.id}</Text>
            </View>
          ))}
        </Glide>
      </View>
    </View>
  );
}

function Demos() {
  const p = usePalette();
  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl * 2 }}>
      <FollowDemo />
      <GlideDemo />
    </ScrollView>
  );
}

export function Spikes({ theme }: PluginScreenProps) {
  return (
    <TokensProvider theme={theme}>
      <Demos />
    </TokensProvider>
  );
}
