// Pure reducers for live updates: an id-keyed map plus an upsert or remove message.
import type { AgentUpdate, PaseoAgent, PaseoWorkspace, WorkspaceUpdate } from "./paseo-types";

export type ById<T> = ReadonlyMap<string, T>;

export const byId = <T extends { id: string }>(items: readonly T[]): ById<T> => new Map(items.map((i) => [i.id, i]));

export function applyAgentUpdate(map: ById<PaseoAgent>, update: AgentUpdate): ById<PaseoAgent> {
  const next = new Map(map);
  if (update.kind === "upsert") next.set(update.agent.id, update.agent as PaseoAgent);
  else next.delete(update.agentId);
  return next;
}

export function applyWorkspaceUpdate(map: ById<PaseoWorkspace>, update: WorkspaceUpdate): ById<PaseoWorkspace> {
  const next = new Map(map);
  if (update.kind === "upsert") next.set(update.workspace.id, update.workspace as PaseoWorkspace);
  else next.delete(update.id);
  return next;
}
