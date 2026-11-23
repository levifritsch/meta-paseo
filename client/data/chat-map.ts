// Paseo timeline and permission types to core chat types, and back. Pure; no hooks.
import type { AgentPermissionRequest, AgentPermissionResponse, AgentTimelineItem, ToolCallDetail } from "@getpaseo/protocol/agent-types";
import { z } from "zod";
import {
  answerTexts,
  summarizeTool,
  type Action,
  type Answer,
  type ChatBlock,
  type ChatEntry,
  type Question,
  type Request,
  type ToolDetail,
} from "../../shared/core";

export type RawEntry = { item: AgentTimelineItem; turnId?: string; timestamp: string; seqStart: number };

function mapDetail(detail: ToolCallDetail, name: string): ToolDetail {
  switch (detail.type) {
    case "shell":
      return { type: "shell", command: detail.command, output: detail.output };
    case "edit":
      return { type: "edit", filePath: detail.filePath, diff: detail.unifiedDiff };
    case "write":
      return { type: "write", filePath: detail.filePath, content: detail.content };
    case "read":
      return { type: "read", filePath: detail.filePath };
    case "plain_text":
      return { type: "other", label: detail.label ?? name };
    default:
      return { type: "other", label: name };
  }
}

function mapBlock(item: AgentTimelineItem, seq: number): ChatBlock | null {
  const id = (kind: string) => `${kind}:${seq}`;
  switch (item.type) {
    case "user_message":
      return { kind: "user", id: item.messageId ?? id("user"), text: item.text };
    case "assistant_message":
      return { kind: "assistant", id: item.messageId ?? id("assistant"), text: item.text };
    case "reasoning":
      return { kind: "reasoning", id: id("reasoning"), text: item.text };
    case "tool_call":
      return { kind: "tool", id: item.callId, name: item.name, status: item.status, detail: mapDetail(item.detail, item.name) };
    case "todo":
      return { kind: "todo", id: id("todo"), items: item.items.map((t) => ({ text: t.text, done: t.completed })) };
    case "error":
      return { kind: "error", id: id("error"), message: item.message };
    case "notification":
      return { kind: "notice", id: id("notice"), level: item.level, message: item.message };
    default:
      return null; // compaction and plugin items have no row yet
  }
}

export function mapEntry(raw: RawEntry): ChatEntry | null {
  const block = mapBlock(raw.item, raw.seqStart);
  return block ? { block, turnId: raw.turnId, timestamp: Date.parse(raw.timestamp) || 0 } : null;
}

const questionsSchema = z.array(
  z.object({
    question: z.string(),
    header: z.string().optional(),
    multiSelect: z.boolean().optional(),
    options: z.array(z.object({ label: z.string(), description: z.string().optional() })),
  }),
);

const DEFAULT_ACTIONS: Action[] = [
  { id: "allow", label: "Allow", behavior: "allow", variant: "primary" },
  { id: "deny", label: "Deny", behavior: "deny", variant: "danger" },
];

function mapActions(raw: AgentPermissionRequest): Action[] {
  return raw.actions?.length
    ? raw.actions.map((a) => ({ id: a.id, label: a.label, behavior: a.behavior, variant: a.variant }))
    : DEFAULT_ACTIONS;
}

/** The command, diff or file content a permission asks about, if it names one. */
function requestCode(raw: AgentPermissionRequest): string | undefined {
  const d = raw.detail;
  if (d?.type === "shell") return d.command;
  if (d?.type === "edit") return d.unifiedDiff ?? d.newString;
  if (d?.type === "write") return d.content;
  const cmd = raw.input?.["command"];
  return typeof cmd === "string" ? cmd : undefined;
}

export function mapRequest(raw: AgentPermissionRequest): Request {
  if (raw.kind === "question") {
    const parsed = questionsSchema.safeParse(raw.input?.["questions"]);
    if (parsed.success && parsed.data.length > 0) {
      const questions: Question[] = parsed.data.map((q) => ({
        prompt: q.question,
        header: q.header,
        multiSelect: q.multiSelect ?? false,
        options: q.options,
      }));
      return { kind: "question", id: raw.id, questions };
    }
  }
  const title = raw.title ?? raw.name;
  if (raw.kind === "plan") {
    const fromInput = raw.input?.["plan"];
    const text = raw.detail?.type === "plan" ? raw.detail.text : typeof fromInput === "string" ? fromInput : (raw.description ?? "");
    return { kind: "plan", id: raw.id, title: raw.title, text, actions: mapActions(raw) };
  }
  if (raw.kind === "tool") {
    return { kind: "permission", id: raw.id, title, description: raw.description, code: requestCode(raw), actions: mapActions(raw) };
  }
  return { kind: "other", id: raw.id, title, description: raw.description, actions: mapActions(raw) };
}

/** Pressing one of a request's buttons. */
export function actionResponse(raw: AgentPermissionRequest, actionId: string): AgentPermissionResponse {
  const action = mapActions(raw).find((a) => a.id === actionId);
  return action?.behavior === "deny"
    ? { behavior: "deny", selectedActionId: actionId }
    : { behavior: "allow", selectedActionId: actionId };
}

/**
 * Answering a question: allow, with the answers added to the tool's input as `answers`, keyed by
 * question text. This is the shape Claude Code's AskUserQuestion reads. Unverified against Paseo.
 */
export function questionResponse(raw: AgentPermissionRequest, questions: Question[], answers: Answer[]): AgentPermissionResponse {
  return { behavior: "allow", updatedInput: { ...(raw.input ?? {}), answers: answerTexts(questions, answers) } };
}

export { summarizeTool };
