import { Markdown } from "@getpaseo/plugin/client/ui";
import { Text, View } from "react-native";
import { summarizeTool, type ChatBlock, type ToolStatus } from "../../../shared/core";
import { Dot } from "../atoms";
import { usePalette } from "../tokens/context";
import { font, radius, space, type Palette } from "../tokens/tokens";

const toolColor = (p: Palette, s: ToolStatus) => (s === "running" ? p.running : s === "failed" ? p.error : p.muted);

/** One block of a turn. Tool calls are dimmed to half. */
export function ChatRow({ block }: { block: ChatBlock }) {
  const p = usePalette();
  switch (block.kind) {
    case "user":
      return (
        <View style={{ alignSelf: "flex-end", maxWidth: "85%", backgroundColor: p.chrome, borderRadius: radius.md, padding: space.md }}>
          <Text selectable style={{ color: p.text, fontSize: font.md }}>
            {block.text}
          </Text>
        </View>
      );
    case "assistant":
      return <Markdown>{block.text}</Markdown>;
    case "reasoning":
      return (
        <Text style={{ color: p.muted, fontSize: font.sm, fontStyle: "italic" }} numberOfLines={3}>
          {block.text}
        </Text>
      );
    case "tool":
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, opacity: 0.5 }}>
          <Dot color={toolColor(p, block.status)} />
          <Text style={{ color: p.text, fontSize: font.sm, flexShrink: 1 }} numberOfLines={1}>
            {block.name} {summarizeTool(block.detail, block.name)}
          </Text>
        </View>
      );
    case "todo":
      return (
        <View style={{ gap: space.xs }}>
          {block.items.map((t, i) => (
            <Text key={i} style={{ color: t.done ? p.muted : p.text, fontSize: font.sm }}>
              {t.done ? "☑" : "☐"} {t.text}
            </Text>
          ))}
        </View>
      );
    case "notice":
      return (
        <Text style={{ color: block.level === "error" ? p.error : block.level === "warning" ? p.question : p.muted, fontSize: font.sm }}>
          {block.message}
        </Text>
      );
    case "error":
      return (
        <Text selectable style={{ color: p.error, fontSize: font.md }}>
          {block.message}
        </Text>
      );
  }
}
