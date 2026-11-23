// The only place chat touches Paseo's client API: timeline pages, live updates, send, answers.
import { useAgent, usePaseo } from "@getpaseo/plugin/client";
import type { AgentRef } from "@getpaseo/plugin/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildTurns, type Answer, type Question, type Request, type Turn } from "../../shared/core";
import { actionResponse, mapEntry, mapRequest, questionResponse, type RawEntry } from "./chat-map";

const PAGE_TURNS = 4;
const LIVE_REFRESH_MS = 250;

type Cursor = { epoch: string; seq: number };
type Page = { entries: RawEntry[]; startCursor: Cursor | null; hasOlder: boolean };

export function useAgentChat(agentRef: AgentRef) {
  const paseo = usePaseo();
  const handle = useMemo(() => paseo.agents.ref(agentRef), [paseo, agentRef]);
  const agent = useAgent(agentRef);
  const [, bump] = useState(0);
  const [tailEntries, setTailEntries] = useState<Map<number, RawEntry>>(new Map());
  const [hasOlder, setHasOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const oldest = useRef<Cursor | null>(null);
  const tailSeen = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(
    async (opts: { direction: "tail" | "before"; cursor?: Cursor }): Promise<Page> => {
      const page = await handle.timeline.refetch({ ...opts, limit: PAGE_TURNS, projection: "projected", wholeTurns: true });
      return {
        entries: page.entries.map((e) => ({ item: e.item, turnId: e.turnId, timestamp: e.timestamp, seqStart: e.seqStart })),
        startCursor: page.startCursor,
        hasOlder: page.hasOlder,
      };
    },
    [handle],
  );

  // The tail only accumulates, so a window that slides forward never leaves a gap above it.
  const refreshTail = useCallback(async () => {
    try {
      const page = await fetchPage({ direction: "tail" });
      if (!tailSeen.current) {
        tailSeen.current = true;
        oldest.current = page.startCursor;
        setHasOlder(page.hasOlder);
      }
      setTailEntries((prev) => {
        const next = new Map(prev);
        for (const e of page.entries) next.set(e.seqStart, e);
        return next;
      });
      setError(null);
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [fetchPage]);

  useEffect(() => {
    tailSeen.current = false;
    oldest.current = null;
    setTailEntries(new Map());
    setReady(false);
    void refreshTail();
    // Live events only say something changed; refetching the projected tail is simpler and
    // right: Paseo merges streamed chunks for us. Coalesced so streaming does not flood it.
    const schedule = () => {
      if (timer.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        void refreshTail();
      }, LIVE_REFRESH_MS);
    };
    const offTimeline = handle.timeline.subscribe(schedule);
    const offAgent = handle.subscribe(() => {
      bump((n) => n + 1);
      schedule();
    });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      offTimeline();
      offAgent();
    };
  }, [handle, refreshTail]);

  const tailTurns: Turn[] = useMemo(() => {
    const sorted = [...tailEntries.values()].sort((a, b) => a.seqStart - b.seqStart);
    return buildTurns(sorted.flatMap((e) => mapEntry(e) ?? []));
  }, [tailEntries]);

  /** One page of turns above everything loaded. The caller holds them. */
  const fetchOlder = useCallback(async (): Promise<Turn[]> => {
    if (!oldest.current) return [];
    const page = await fetchPage({ direction: "before", cursor: oldest.current });
    oldest.current = page.startCursor ?? oldest.current;
    setHasOlder(page.hasOlder);
    const sorted = [...page.entries].sort((a, b) => a.seqStart - b.seqStart);
    return buildTurns(sorted.flatMap((e) => mapEntry(e) ?? []));
  }, [fetchPage]);

  const rawRequests = handle.pendingPermissions ?? [];
  const requests: Request[] = rawRequests.map(mapRequest);

  return {
    agent,
    ready,
    error,
    tailTurns,
    hasOlder,
    fetchOlder,
    requests,
    send: (text: string) => handle.send(text),
    /** Press one of a request's buttons. */
    act: (requestId: string, actionId: string) => {
      const raw = rawRequests.find((r) => r.id === requestId);
      return raw ? handle.respondToPermission({ requestId, response: actionResponse(raw, actionId) }) : Promise.resolve();
    },
    /** Answer a question request. */
    answer: (requestId: string, questions: Question[], answers: Answer[]) => {
      const raw = rawRequests.find((r) => r.id === requestId);
      return raw ? handle.respondToPermission({ requestId, response: questionResponse(raw, questions, answers) }) : Promise.resolve();
    },
  };
}
