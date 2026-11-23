import type { ChatBlock, ChatEntry, ToolDetail, Turn } from "./types";

/**
 * Group entries into turns. With turn ids, a change of id starts a turn, so a message that steers
 * a running turn joins it. Without them, a user message starts a turn unless the last block is
 * already a user message.
 */
export function buildTurns(entries: ChatEntry[]): Turn[] {
  const turns: Turn[] = [];
  for (const e of entries) {
    const cur = turns.at(-1);
    const last = cur?.blocks.at(-1);
    const startsTurn =
      !cur ||
      (e.turnId !== undefined && cur.turnId !== undefined
        ? e.turnId !== cur.turnId
        : e.block.kind === "user" && last?.kind !== "user");
    if (startsTurn) {
      turns.push({ id: e.turnId ?? e.block.id, turnId: e.turnId, blocks: [e.block], startedAt: e.timestamp });
    } else {
      cur.blocks.push(e.block);
      cur.turnId ??= e.turnId;
    }
  }
  return turns;
}

/** The last assistant reply of the last turn, or null before it has one. */
export function latestReply(turns: Turn[]): ChatBlock | null {
  const last = turns.at(-1);
  return [...(last?.blocks ?? [])].reverse().find((b) => b.kind === "assistant") ?? null;
}

/** One line for a tool call: the command, the file, or the label. */
export function summarizeTool(detail: ToolDetail, name: string): string {
  switch (detail.type) {
    case "shell":
      return detail.command.split("\n")[0] ?? name;
    case "edit":
    case "write":
    case "read":
      return detail.filePath;
    case "other":
      return detail.label || name;
  }
}
