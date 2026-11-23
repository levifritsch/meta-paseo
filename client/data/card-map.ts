// Pure: Paseo sessions in, board cards out. No React, no client calls (docs/board-screen.md, 4b.1).
import type { Card, CardState, Workspace } from "../../shared/core";
import type { PaseoAgent } from "./paseo-types";

/** The label Paseo puts on a session started by another session (a sub-agent). */
export const PARENT_AGENT_LABEL = "paseo.parent-agent-id";

export type PaseoWorkspaceLike = { id: string; name: string; title?: string | null; projectDisplayName?: string };

export type HiddenKind = "sub-agent" | "background" | "internal";
/** A session that gets no card. Kept so step 5's queue can show its requests under the parent. */
export type HiddenSession = { id: string; kind: HiddenKind; parentId: string | null; requests: PaseoAgent["pendingPermissions"] };

export type CardExtras = { subAgents: number; backgroundTasks: number; createdAt: number };

export type MappedBoard = {
  cards: Card[];
  /** Counts shown on a card, by card id. */
  extras: Record<string, CardExtras>;
  hidden: HiddenSession[];
};

export const parentOf = (agent: PaseoAgent): string | null => {
  const id = (agent.labels as Record<string, string> | undefined)?.[PARENT_AGENT_LABEL];
  return id ? id : null;
};

export function hiddenKind(agent: PaseoAgent): HiddenKind | null {
  if (agent.internal) return "internal";
  if (agent.background) return "background";
  if (parentOf(agent)) return "sub-agent";
  return null;
}

const BLOCKING = new Set(["tool", "plan", "mode", "other"]);

/** Session to card state. See the table in board-screen.md. */
export function cardState(agent: PaseoAgent, busyHelpers: boolean): CardState {
  const kinds = agent.pendingPermissions.map((r) => r.kind);
  if (kinds.some((k) => BLOCKING.has(k))) return "permission";
  if (kinds.includes("question")) return "needs";
  if (agent.status === "error" || agent.attentionReason === "error") return "failed";
  if (agent.status === "running" || agent.status === "initializing") return "running";
  if (busyHelpers) return "running"; // C1: the turn is over but helpers still work
  return "done";
}

const WAITING = new Set<CardState>(["needs", "permission", "failed"]);
const time = (iso: string | null | undefined) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : undefined;
};

export function mapBoard(agents: readonly PaseoAgent[], workspaces: readonly PaseoWorkspaceLike[]): MappedBoard {
  const byId = new Map(workspaces.map((w) => [w.id, w]));
  const hidden: HiddenSession[] = [];
  const shown: PaseoAgent[] = [];
  for (const a of agents) {
    if (a.archivedAt) continue;
    const kind = hiddenKind(a);
    if (kind) hidden.push({ id: a.id, kind, parentId: parentOf(a), requests: a.pendingPermissions });
    else shown.push(a);
  }

  const children = new Map<string, PaseoAgent[]>();
  for (const a of agents) {
    const parent = parentOf(a);
    if (parent && !a.archivedAt) children.set(parent, [...(children.get(parent) ?? []), a]);
  }
  const working = (a: PaseoAgent) => a.status === "running" || a.status === "initializing";

  const cards: Card[] = [];
  const extras: Record<string, CardExtras> = {};
  for (const a of shown) {
    const kids = children.get(a.id) ?? [];
    const subAgents = kids.filter((k) => !k.internal && !k.background).length;
    const backgroundTasks = a.backgroundWork?.count ?? 0;
    const busy = kids.some(working) || (a.backgroundWork?.runningCount ?? 0) > 0;
    const state = cardState(a, busy);
    const ws = a.workspaceId ? byId.get(a.workspaceId) : undefined;
    const lastActivity = time(a.updatedAt) ?? 0;
    cards.push({
      id: a.id,
      state,
      workspace: a.workspaceId ?? a.cwd,
      project: ws?.projectDisplayName,
      model: a.model ?? undefined,
      title: a.title?.trim() || "New session",
      lastActivity,
      waitingSince: WAITING.has(state) ? (time(a.attentionTimestamp) ?? lastActivity) : undefined,
      hasSubAgents: subAgents + backgroundTasks > 0,
    });
    extras[a.id] = { subAgents, backgroundTasks, createdAt: time(a.createdAt) ?? lastActivity };
  }
  return { cards, extras, hidden };
}

/** Workspaces the board may show as columns. Internal and background ones never get a column. */
export function mapWorkspaces(list: ReadonlyArray<PaseoWorkspaceLike & { internal?: boolean; background?: boolean; archivingAt?: string | null }>): Workspace[] {
  return list.filter((w) => !w.internal && !w.background && !w.archivingAt).map((w) => ({ id: w.id, name: (w.title?.trim() || w.name) }));
}
