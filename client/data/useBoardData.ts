// The board's one data source: live sessions and workspaces, mapped to core cards.
import { usePaseo } from "@getpaseo/plugin/client";
import { useEffect, useMemo, useState } from "react";
import type { Card, Workspace } from "../../shared/core";
import { mapBoard, mapWorkspaces, type CardExtras, type HiddenSession } from "./card-map";
import { applyAgentUpdate, applyWorkspaceUpdate } from "./live-map";
import type { AgentUpdate, PaseoAgent, PaseoWorkspace, WorkspaceUpdate } from "./paseo-types";
import { useLiveCollection } from "./useLiveCollection";

const PAGE = 200; // the host rejects a larger page
const CLOCK_MS = 30_000;

type Page<E> = { entries: E[]; pageInfo: { hasMore: boolean; nextCursor: string | null } };

/** Follows `nextCursor` until the host has no more, so the board sees every session. */
async function withAllPages<E, R extends Page<E>>(first: R, next: (cursor: string) => Promise<Page<E>>): Promise<R> {
  const entries = [...first.entries];
  let info = first.pageInfo;
  while (info.hasMore && info.nextCursor) {
    const page = await next(info.nextCursor);
    entries.push(...page.entries);
    info = page.pageInfo;
  }
  return { ...first, entries };
}

export type BoardData = {
  cards: Card[];
  extras: Record<string, CardExtras>;
  hidden: HiddenSession[];
  workspaces: { loaded: boolean; list: Workspace[] };
  /** Sessions failed to load, or never loaded yet. Distinct from "no sessions". */
  error: string | null;
  now: number;
};

export function useBoardData(): BoardData {
  const paseo = usePaseo();
  const agents = useLiveCollection<PaseoAgent, AgentUpdate>({
    // Sub-agents and background sessions come too: they feed the parent's counts and state (C1, C2).
    open: async () => {
      const filter = { includeBackground: true };
      const first = await paseo.agents.list({ filter, page: { limit: PAGE }, subscribe: {} });
      return withAllPages(first, (cursor) => paseo.agents.list({ filter, page: { limit: PAGE, cursor } }));
    },
    onUpdate: (h) => paseo.agents.subscribe(h),
    apply: applyAgentUpdate,
    deps: [paseo],
  });
  const workspaces = useLiveCollection<PaseoWorkspace, WorkspaceUpdate>({
    open: async () => {
      const first = await paseo.workspaces.list({ page: { limit: PAGE }, subscribe: {} });
      return withAllPages(first, (cursor) => paseo.workspaces.list({ page: { limit: PAGE, cursor } }));
    },
    onUpdate: (h) => paseo.workspaces.subscribe(h),
    apply: applyWorkspaceUpdate,
    deps: [paseo],
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => clearInterval(t);
  }, []);

  const wsList = useMemo(() => [...workspaces.items.values()], [workspaces.items]);
  const mapped = useMemo(() => mapBoard([...agents.items.values()], wsList), [agents.items, wsList]);
  const list = useMemo(() => mapWorkspaces(wsList), [wsList]);
  return {
    ...mapped,
    workspaces: { loaded: workspaces.loaded, list },
    error: agents.error ?? workspaces.error,
    now,
  };
}
