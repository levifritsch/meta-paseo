import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { summarizeTool, type ChatBlock, type ToolStatus } from "../../../shared/core";
import { usePalette, useFont } from "../tokens/context";
import { radius, tint, type Palette } from "../tokens/tokens";
import { Reply } from "./Reply";

const toolColor = (p: Palette, s: ToolStatus) => (s === "running" ? p.running : s === "failed" ? p.error : p.muted);

/** Tool calls sit back from the conversation. */
const TOOL_OPACITY = 0.5;
/** A prompt shows this many lines; a press shows it all. */
const PROMPT_LINES = 6;

export function ErrorBox({ text }: { text: string }) {
  const p = usePalette();
  const f = useFont();
  return (
    <View style={{ backgroundColor: tint(p.error, 0.12), borderRadius: radius.control, padding: 8 }}>
      <Text selectable style={{ color: p.error, fontSize: f.sm }}>
        {text}
      </Text>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  const p = usePalette();
  const f = useFont();
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityLabel={open ? "Fold prompt" : "Show the whole prompt"}
      onPress={() => setOpen((v) => !v)}
      style={{ alignSelf: "flex-end", maxWidth: "88%", backgroundColor: tint(p.border, 0.55), borderRadius: radius.bubble, borderBottomRightRadius: 3, paddingHorizontal: 10, paddingVertical: 6 }}
    >
      <Text style={{ color: p.text, fontSize: f.lg - 1 }} numberOfLines={open ? undefined : PROMPT_LINES}>
        {text}
      </Text>
    </Pressable>
  );
}

/** One block of a turn. */
export function ChatRow({ block }: { block: ChatBlock }) {
  const p = usePalette();
  const f = useFont();
  switch (block.kind) {
    case "user":
      return <UserBubble text={block.text} />;
    case "assistant":
      return <Reply text={block.text} />;
    case "reasoning":
      return (
        <Text style={{ color: p.muted, fontSize: f.sm, fontStyle: "italic" }} numberOfLines={3}>
          {block.text}
        </Text>
      );
    case "tool":
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, opacity: TOOL_OPACITY }}>
          <Text style={{ color: toolColor(p, block.status), fontSize: f.xxs }}>{block.status === "running" ? "●" : "▸"}</Text>
          <Text numberOfLines={1} style={{ color: p.muted, fontSize: f.sm, flexShrink: 1 }}>
            <Text style={{ color: p.text, fontWeight: "500" }}>{block.name}</Text>
            {` ${summarizeTool(block.detail, block.name)}`}
          </Text>
        </View>
      );
    case "todo":
      return (
        <View style={{ gap: 2 }}>
          {block.items.map((t, i) => (
            <Text key={i} style={{ color: t.done ? p.muted : p.text, fontSize: f.sm }}>
              {t.done ? "☑" : "☐"} {t.text}
            </Text>
          ))}
        </View>
      );
    case "notice":
      return (
        <Text style={{ color: block.level === "error" ? p.error : block.level === "warning" ? p.question : p.muted, fontSize: f.xs, fontStyle: "italic" }}>
          {block.message}
        </Text>
      );
    case "error":
      return <ErrorBox text={block.message} />;
  }
}
